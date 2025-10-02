import { Innertube, UniversalCache } from "youtubei.js";
import { logger } from "./logger";

export interface SearchResult {
	url: string;
	title: string;
	duration: string;
	thumbnail?: string;
}

export class YouTubeService {
	private static instance: YouTubeService | null = null;
	private readonly maxResults: number;
	private yt: Innertube | null = null;
	private initPromise: Promise<void> | null = null;

	private constructor(maxResults = 5) {
		this.maxResults = maxResults;
	}

	/**
	 * Get singleton instance of YouTubeService
	 */
	static getInstance(maxResults = 5): YouTubeService {
		if (!YouTubeService.instance) {
			YouTubeService.instance = new YouTubeService(maxResults);
		}
		return YouTubeService.instance;
	}

	/**
	 * Initialize YouTube client (lazy initialization)
	 * Singleton pattern ensures only one client is created
	 */
	private async init(): Promise<void> {
		if (this.yt) return;

		if (!this.initPromise) {
			this.initPromise = (async () => {
				try {
					// Capture console warnings during initialization to detect signature failures
					const originalWarn = console.warn;
					let signatureWarningDetected = false;

					console.warn = (...args: unknown[]) => {
						const message = args.join(" ");
						if (
							message.includes("signature") ||
							message.includes("decipher") ||
							message.includes("YOUTUBEJS")
						) {
							signatureWarningDetected = true;
							// Don't log the warning object to avoid circular reference memory issues
							// The original warning will still be printed via originalWarn below
						}
						originalWarn.apply(console, args);
					};

					this.yt = await Innertube.create({
						cache: new UniversalCache(false),
						generate_session_locally: true,
						client_type: "IOS", // iOS client has better compatibility and avoids signature issues
						retrieve_player: false, // Skip player download to avoid signature issues
					});

					// Restore console.warn
					console.warn = originalWarn;

					if (signatureWarningDetected) {
						logger.error(
							"YouTube client initialized but signature decipher failed - playback will not work",
						);
						this.yt = null;
						this.initPromise = null;
						throw new Error(
							"SIGNATURE_DECIPHER_FAILED: YouTube's player code has been updated. Please update youtubei.js or try again later.",
						);
					}

					logger.info("YouTube client initialized successfully");
				} catch (error) {
					const errorMessage = (error as Error).message;
					if (errorMessage.includes("SIGNATURE_DECIPHER_FAILED")) {
						logger.error("YouTube signature decipher failure", error as Error);
						this.initPromise = null;
						throw error; // Re-throw the specific error
					}

					logger.error("Failed to initialize YouTube client", error as Error);
					this.initPromise = null; // Reset on error to allow retry
					throw new Error("Failed to initialize YouTube service");
				}
			})();
		}

		await this.initPromise;
	}

	async search(query: string): Promise<SearchResult[]> {
		try {
			await this.init();

			if (!this.yt) {
				throw new Error("YouTube client not initialized");
			}

			logger.debug("Searching YouTube", { query, maxResults: this.maxResults });

			const searchResults = await this.yt.search(query, {
				type: "video",
			});

			const videos = searchResults.videos?.slice(0, this.maxResults) || [];

			if (videos.length === 0) {
				logger.info("No YouTube results found", { query });
				return [];
			}

			const results: SearchResult[] = videos
				.map((video) => {
					// Type guard to ensure we have a proper video object
					if (!("id" in video) || !("title" in video)) {
						return null;
					}

					const thumbnail =
						"best_thumbnail" in video
							? (video.best_thumbnail as { url?: string })?.url
							: undefined;
					const duration =
						"duration" in video ? (video.duration as { text?: string })?.text : "Unknown";

					return {
						url: `https://www.youtube.com/watch?v=${video.id}`,
						title: (video.title as { text?: string }).text || "Unknown Title",
						duration: duration || "Unknown",
						...(thumbnail && { thumbnail }),
					};
				})
				.filter((video): video is SearchResult => video !== null);

			logger.debug("YouTube search completed", {
				query,
				resultCount: results.length,
			});

			return results;
		} catch (error) {
			const errorMessage = (error as Error).message;

			// Handle signature decipher failures specifically
			if (errorMessage.includes("SIGNATURE_DECIPHER_FAILED")) {
				throw new Error(
					"🚫 YouTube playback is currently unavailable due to API changes.\n\n" +
						"**What happened?** YouTube updated their player code and the library needs to be updated.\n\n" +
						"**What to do:**\n" +
						"1. Try again in a few hours (the library usually updates quickly)\n" +
						"2. Ask the bot owner to run: `bun update youtubei.js`\n" +
						"3. Use a different music source temporarily",
				);
			}

			logger.error("YouTube search failed", error as Error, { query });
			throw new Error("Failed to search YouTube. Please try again later.");
		}
	}

	/**
	 * Get audio stream for a YouTube video
	 * Returns a readable stream optimized for Discord voice
	 */
	async getAudioStream(url: string): Promise<ReadableStream<Uint8Array>> {
		try {
			await this.init();

			if (!this.yt) {
				throw new Error("YouTube client not initialized");
			}

			logger.debug("Getting audio stream", { url });

			const info = await this.yt.getInfo(url);

			// Get best audio format - prefer Opus for optimal performance
			const format = info.chooseFormat({
				type: "audio",
				quality: "best",
			});

			if (!format) {
				throw new Error("No suitable audio format found");
			}

			logger.debug("Selected audio format", {
				url,
				mimeType: format.mime_type,
				bitrate: format.bitrate,
			});

			const videoId = info.basic_info.id;
			if (!videoId) {
				throw new Error("No video ID found");
			}

			const stream = await this.yt.download(videoId, {
				type: "audio",
				quality: "best",
				format: "any",
			});

			return stream;
		} catch (error) {
			const errorMessage = (error as Error).message || String(error);

			// Detect specific YouTube errors
			if (errorMessage.includes("signature") || errorMessage.includes("decipher")) {
				logger.error(
					"YouTube signature decipher failure - YouTube may have updated their player code",
					error as Error,
					{ url },
				);
				throw new Error(
					"YouTube playback is temporarily unavailable. This usually fixes itself within a few hours. Please try again later or use a different video.",
				);
			}

			if (errorMessage.includes("unavailable")) {
				logger.error("Video unavailable", error as Error, { url });
				throw new Error(
					"This video is unavailable. It may be private, deleted, or restricted in your region.",
				);
			}

			logger.error("Failed to get audio stream", error as Error, { url });
			throw new Error("Failed to get audio stream. The video may be unavailable.");
		}
	}

	validateUrl(url: string): boolean {
		const youtubeUrlPattern =
			/^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
		return youtubeUrlPattern.test(url);
	}
}
