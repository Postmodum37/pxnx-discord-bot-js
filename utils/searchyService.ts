import type { AudioStreamResponse, VideoSearchResponse } from "../types/searchyTypes";
import { config } from "./config";
import { logger } from "./logger";

/**
 * Interface for search results compatible with the existing play command
 */
export interface SearchResult {
	url: string;
	title: string;
	duration: string;
	thumbnail?: string;
}

/**
 * Interface for audio stream information
 */
export interface AudioStreamInfo {
	url: string;
	title: string;
	format: {
		id: string;
		ext: string;
		codec: string | null;
		bitrate: number | null;
	};
	expiresIn: number | null;
}

/**
 * Service for interacting with the Searchy API
 * Replaces YouTubeService with calls to our centralized search service
 */
export class SearchyService {
	private static instance: SearchyService | null = null;
	private readonly baseUrl: string;
	private readonly maxResults: number;
	private readonly retryAttempts = 3;
	private readonly retryDelay = 1000; // 1 second

	private constructor(maxResults = 5) {
		this.baseUrl = config.searchyUrl;
		this.maxResults = maxResults;
		logger.info("SearchyService initialized", { baseUrl: this.baseUrl });
	}

	/**
	 * Get singleton instance of SearchyService
	 */
	static getInstance(maxResults = 5): SearchyService {
		if (!SearchyService.instance) {
			SearchyService.instance = new SearchyService(maxResults);
		}
		return SearchyService.instance;
	}

	/**
	 * Extract video ID from YouTube URL
	 */
	private extractVideoId(url: string): string {
		const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
		if (!match || !match[1]) {
			throw new Error("Invalid YouTube URL");
		}
		return match[1];
	}

	/**
	 * Format duration from seconds to MM:SS or HH:MM:SS
	 */
	private formatDuration(seconds: number | null): string {
		if (!seconds) return "Unknown";

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
		}
		return `${minutes}:${secs.toString().padStart(2, "0")}`;
	}

	/**
	 * Retry wrapper for network requests
	 */
	private async retry<T>(fn: () => Promise<T>, operation: string): Promise<T> {
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error as Error;
				logger.warn(`${operation} failed, attempt ${attempt}/${this.retryAttempts}`, {
					error: (error as Error).message,
				});

				if (attempt < this.retryAttempts) {
					await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
				}
			}
		}

		throw lastError || new Error(`${operation} failed after ${this.retryAttempts} attempts`);
	}

	/**
	 * Search for videos using Searchy API
	 */
	async search(query: string): Promise<SearchResult[]> {
		try {
			logger.debug("Searching via Searchy", { query, maxResults: this.maxResults });

			const searchResponse = await this.retry(async () => {
				const response = await fetch(
					`${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${this.maxResults}`,
				);

				if (!response.ok) {
					throw new Error(`Searchy API returned ${response.status}: ${response.statusText}`);
				}

				return (await response.json()) as VideoSearchResponse;
			}, "Search");

			if (searchResponse.results.length === 0) {
				logger.info("No search results from Searchy", { query });
				return [];
			}

			// Convert Searchy results to SearchResult format
			const results: SearchResult[] = searchResponse.results.map((item) => {
				const result: SearchResult = {
					url: item.url,
					title: item.title,
					duration: this.formatDuration(item.duration),
				};
				if (item.thumbnail) {
					result.thumbnail = item.thumbnail;
				}
				return result;
			});

			logger.debug("Search completed via Searchy", {
				query,
				resultCount: results.length,
			});

			return results;
		} catch (error) {
			logger.error("Search via Searchy failed", error as Error, { query });
			throw new Error(
				`Failed to search via Searchy. Please ensure the Searchy service is running at ${this.baseUrl}`,
			);
		}
	}

	/**
	 * Get audio stream URL for a YouTube video
	 * Returns direct YouTube URL that can be fetched with standard HTTP (yt-dlp 2025.10.22+)
	 */
	async getAudioStreamUrl(url: string): Promise<AudioStreamInfo> {
		try {
			const videoId = this.extractVideoId(url);
			logger.debug("Getting audio stream URL via Searchy", { url, videoId });

			const audioResponse = await this.retry(async () => {
				const response = await fetch(`${this.baseUrl}/audio/${videoId}`);

				if (!response.ok) {
					if (response.status === 404) {
						throw new Error("Video not found or unavailable");
					}
					throw new Error(`Searchy API returned ${response.status}: ${response.statusText}`);
				}

				return (await response.json()) as AudioStreamResponse;
			}, "Get audio stream");

			const streamInfo: AudioStreamInfo = {
				url: audioResponse.audio_format.url,
				title: audioResponse.title,
				format: {
					id: audioResponse.audio_format.format_id,
					ext: audioResponse.audio_format.ext,
					codec: audioResponse.audio_format.acodec,
					bitrate: audioResponse.audio_format.abr,
				},
				expiresIn: audioResponse.url_expires_in,
			};

			logger.debug("Audio stream URL retrieved via Searchy", {
				url,
				videoId,
				formatId: streamInfo.format.id,
				codec: streamInfo.format.codec,
				bitrate: streamInfo.format.bitrate,
			});

			return streamInfo;
		} catch (error) {
			const errorMessage = (error as Error).message;

			if (errorMessage.includes("Invalid YouTube URL")) {
				throw error;
			}

			if (errorMessage.includes("not found")) {
				logger.error("Video not found via Searchy", error as Error, { url });
				throw new Error(
					"This video is not available. It may be private, deleted, or restricted in your region.",
				);
			}

			logger.error("Failed to get audio stream via Searchy", error as Error, { url });
			throw new Error(
				`Failed to get audio stream via Searchy. Please ensure the Searchy service is running at ${this.baseUrl}`,
			);
		}
	}
}
