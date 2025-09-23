import ytsr from "@distube/ytsr";
import { logger } from "./logger";

export interface SearchResult {
	url: string;
	title: string;
	duration: string;
	thumbnail?: string;
}

export class YouTubeService {
	private readonly maxResults: number;

	constructor(maxResults = 5) {
		this.maxResults = maxResults;
	}

	async search(query: string): Promise<SearchResult[]> {
		try {
			logger.debug("Searching YouTube", { query, maxResults: this.maxResults });

			const searchResults = await ytsr(query, { limit: this.maxResults });

			if (!searchResults.items || searchResults.items.length === 0) {
				logger.info("No YouTube results found", { query });
				return [];
			}

			const results: SearchResult[] = searchResults.items.map((item) => {
				const thumbnailUrl = typeof item.thumbnail === "string"
					? item.thumbnail
					: (item.thumbnail as { url?: string })?.url;

				return {
					url: item.url,
					title: item.name,
					duration: item.duration ?? "Unknown",
					...(thumbnailUrl && { thumbnail: thumbnailUrl }),
				};
			});

			logger.debug("YouTube search completed", {
				query,
				resultCount: results.length,
			});

			return results;
		} catch (error) {
			logger.error("YouTube search failed", error as Error, { query });
			throw new Error("Failed to search YouTube. Please try again later.");
		}
	}

	validateUrl(url: string): boolean {
		const youtubeUrlPattern =
			/^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
		return youtubeUrlPattern.test(url);
	}
}
