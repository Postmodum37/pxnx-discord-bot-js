import { Readable } from "node:stream";
import {
	AudioPlayerStatus,
	createAudioResource,
	demuxProbe,
	type VoiceConnection,
} from "@discordjs/voice";
import type { ChatInputCommandInteraction } from "discord.js";
import { audioPlayerManager } from "./audioPlayerManager";
import { logger } from "./logger";
import { SearchyService } from "./searchyService";

export interface QueueItem {
	url: string;
	title: string;
	requestedBy: string;
	addedAt: Date;
}

interface GuildQueueData {
	items: QueueItem[];
	lastActivity: Date;
}

class QueueService {
	private queues = new Map<string, GuildQueueData>();
	private cleanupInterval: Timer | null = null;
	private readonly CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
	private readonly QUEUE_TTL = 60 * 60 * 1000; // 1 hour
	private searchyService: SearchyService;

	constructor() {
		this.startCleanupTimer();
		this.searchyService = SearchyService.getInstance();
	}

	private startCleanupTimer(): void {
		this.cleanupInterval = setInterval(() => {
			this.cleanupInactiveQueues();
		}, this.CLEANUP_INTERVAL);
	}

	private cleanupInactiveQueues(): void {
		const now = new Date();
		const expiredGuilds: string[] = [];

		for (const [guildId, queueData] of this.queues.entries()) {
			if (now.getTime() - queueData.lastActivity.getTime() > this.QUEUE_TTL) {
				expiredGuilds.push(guildId);
			}
		}

		for (const guildId of expiredGuilds) {
			this.queues.delete(guildId);
			logger.debug("Cleaned up expired queue", { guildId });
		}

		if (expiredGuilds.length > 0) {
			logger.info("Queue cleanup completed", {
				cleanedQueues: expiredGuilds.length,
				activeQueues: this.queues.size,
			});
		}
	}

	private updateActivity(guildId: string): void {
		const queueData = this.queues.get(guildId);
		if (queueData) {
			queueData.lastActivity = new Date();
		}
	}

	addToQueue(guildId: string, item: QueueItem): void {
		if (!this.queues.has(guildId)) {
			this.queues.set(guildId, {
				items: [],
				lastActivity: new Date(),
			});
		}

		const queueData = this.queues.get(guildId);
		if (!queueData) {
			throw new Error(`Queue data not found for guild ${guildId}`);
		}
		const queueItem: QueueItem = {
			...item,
			addedAt: new Date(),
		};

		queueData.items.push(queueItem);
		this.updateActivity(guildId);

		logger.debug("Added item to queue", {
			guildId,
			title: item.title,
			queueLength: queueData.items.length,
		});
	}

	removeFromQueue(guildId: string): QueueItem | null {
		const queueData = this.queues.get(guildId);
		if (!queueData || queueData.items.length === 0) {
			return null;
		}

		const removedItem = queueData.items.shift();
		if (!removedItem) {
			throw new Error("No items in queue to remove");
		}
		this.updateActivity(guildId);

		logger.debug("Removed item from queue", {
			guildId,
			title: removedItem.title,
			remainingItems: queueData.items.length,
		});

		return removedItem;
	}

	getQueue(guildId: string): QueueItem[] {
		const queueData = this.queues.get(guildId);
		return queueData?.items ?? [];
	}

	clearQueue(guildId: string): void {
		const queueData = this.queues.get(guildId);
		if (queueData) {
			const clearedCount = queueData.items.length;
			queueData.items = [];
			this.updateActivity(guildId);

			logger.info("Queue cleared", {
				guildId,
				clearedItems: clearedCount,
			});
		}
	}

	async playNext(
		guildId: string,
		connection: VoiceConnection,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const queue = this.getQueue(guildId);

		if (queue.length === 0) {
			try {
				if (connection.state.status !== "destroyed") {
					connection.destroy();
				}
				audioPlayerManager.removePlayer(guildId);
				logger.info("Voice connection destroyed - queue empty", { guildId });
			} catch (error) {
				logger.error("Error while destroying connection", error as Error, { guildId });
			}
			this.clearQueue(guildId);
			return;
		}

		try {
			const nextSong = queue[0];
			if (!nextSong) {
				throw new Error("No song in queue to play");
			}
			logger.info("Playing next song", {
				guildId,
				title: nextSong.title,
				url: nextSong.url,
				requestedBy: nextSong.requestedBy,
			});

			// Get audio stream URL from Searchy
			// Searchy uses yt-dlp 2025.10.22+ which generates working YouTube URLs
			const audioInfo = await this.searchyService.getAudioStreamUrl(nextSong.url);

			logger.debug("Audio stream URL retrieved", {
				guildId,
				format: audioInfo.format.ext,
			});

			// Fetch audio stream directly from YouTube
			// yt-dlp 2025.10.22+ URLs work without special headers
			const response = await fetch(audioInfo.url);

			if (!response.ok) {
				throw new Error(`Failed to fetch audio stream: ${response.statusText}`);
			}

			if (!response.body) {
				throw new Error("No response body from audio stream");
			}

			// Convert Web ReadableStream to Node.js Readable stream
			const nodeStream = Readable.fromWeb(
				response.body as unknown as import("stream/web").ReadableStream,
			);

			// Use demuxProbe to automatically detect stream type (Discord.js best practice)
			const { stream: probedStream, type } = await demuxProbe(nodeStream);

			// Create audio resource with detected type and inline volume
			const resource = createAudioResource(probedStream, {
				inputType: type,
				inlineVolume: true,
			});

			// Reuse audio player for this guild (Discord.js best practice)
			const player = audioPlayerManager.getOrCreatePlayer(guildId);

			// Remove all previous listeners to avoid memory leaks
			player.removeAllListeners();

			// Play the resource
			player.play(resource);
			connection.subscribe(player);

			// Handle player state transitions
			player.once(AudioPlayerStatus.Idle, () => {
				logger.debug("Audio player idle - playing next song", { guildId });
				this.removeFromQueue(guildId);
				this.playNext(guildId, connection, interaction);
			});

			player.on("error", (error) => {
				logger.error("Audio player error", error, {
					guildId,
					songTitle: nextSong.title,
				});
				this.removeFromQueue(guildId);
				this.playNext(guildId, connection, interaction);
			});
		} catch (error) {
			const errorMessage = (error as Error).message || String(error);

			logger.error("Error playing song", error as Error, {
				guildId,
				queueLength: queue.length,
			});

			// Notify user of the specific error
			try {
				if (errorMessage.includes("Searchy") || errorMessage.includes("not available")) {
					// Send user-friendly error message
					await interaction.followUp({
						content: `⚠️ ${errorMessage}`,
						flags: 64, // Ephemeral flag
					});
				}
			} catch (notifyError) {
				logger.error("Failed to notify user of playback error", notifyError as Error);
			}

			this.removeFromQueue(guildId);
			this.playNext(guildId, connection, interaction);
		}
	}

	// Cleanup method for graceful shutdown
	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
		this.queues.clear();
		audioPlayerManager.destroy();
		logger.info("Queue service destroyed");
	}

	// Get statistics for monitoring
	getStats(): {
		totalQueues: number;
		totalItems: number;
		oldestQueue: Date | null;
	} {
		let totalItems = 0;
		let oldestQueue: Date | null = null;

		for (const queueData of this.queues.values()) {
			totalItems += queueData.items.length;
			if (!oldestQueue || queueData.lastActivity < oldestQueue) {
				oldestQueue = queueData.lastActivity;
			}
		}

		return {
			totalQueues: this.queues.size,
			totalItems,
			oldestQueue,
		};
	}
}

export const queueService = new QueueService();
