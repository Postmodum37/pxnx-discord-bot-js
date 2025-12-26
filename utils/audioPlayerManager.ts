import {
	type AudioPlayer,
	AudioPlayerStatus,
	createAudioPlayer,
	NoSubscriberBehavior,
} from "@discordjs/voice";
import { logger } from "./logger";

/**
 * Manages audio players per guild to enable player reuse (Discord.js best practice)
 * Instead of creating a new player for each song, we reuse existing players
 */
class AudioPlayerManager {
	private players = new Map<string, AudioPlayer>();
	private cleanupInterval: Timer | null = null;
	private readonly CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
	private readonly PLAYER_TTL = 60 * 60 * 1000; // 1 hour
	private lastActivity = new Map<string, Date>();

	constructor() {
		this.startCleanupTimer();
	}

	private startCleanupTimer(): void {
		this.cleanupInterval = setInterval(() => {
			this.cleanupInactivePlayers();
		}, this.CLEANUP_INTERVAL);
	}

	private cleanupInactivePlayers(): void {
		const now = new Date();
		const expiredGuilds: string[] = [];

		for (const [guildId, lastActivity] of this.lastActivity.entries()) {
			if (now.getTime() - lastActivity.getTime() > this.PLAYER_TTL) {
				const player = this.players.get(guildId);
				if (player?.state.status === AudioPlayerStatus.Idle) {
					expiredGuilds.push(guildId);
				}
			}
		}

		for (const guildId of expiredGuilds) {
			const player = this.players.get(guildId);
			if (player) {
				player.stop(true);
			}
			this.players.delete(guildId);
			this.lastActivity.delete(guildId);
			logger.debug("Cleaned up inactive audio player", { guildId });
		}

		if (expiredGuilds.length > 0) {
			logger.info("Audio player cleanup completed", {
				cleanedPlayers: expiredGuilds.length,
				activePlayers: this.players.size,
			});
		}
	}

	/**
	 * Get or create an audio player for a guild
	 * Reuses existing players for better performance
	 */
	getOrCreatePlayer(guildId: string): AudioPlayer {
		let player = this.players.get(guildId);

		if (!player) {
			player = createAudioPlayer({
				behaviors: {
					noSubscriber: NoSubscriberBehavior.Pause,
				},
			});

			this.players.set(guildId, player);
			logger.debug("Created new audio player", { guildId });
		}

		this.lastActivity.set(guildId, new Date());
		return player;
	}

	/**
	 * Remove a player for a guild
	 */
	removePlayer(guildId: string): void {
		const player = this.players.get(guildId);
		if (player) {
			player.stop(true);
			this.players.delete(guildId);
			this.lastActivity.delete(guildId);
			logger.debug("Removed audio player", { guildId });
		}
	}

	/**
	 * Get player if it exists (without creating)
	 */
	getPlayer(guildId: string): AudioPlayer | undefined {
		return this.players.get(guildId);
	}

	/**
	 * Cleanup method for graceful shutdown
	 */
	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}

		for (const [guildId, player] of this.players.entries()) {
			player.stop(true);
			logger.debug("Stopped player during shutdown", { guildId });
		}

		this.players.clear();
		this.lastActivity.clear();
		logger.info("Audio player manager destroyed");
	}

	/**
	 * Get statistics for monitoring
	 */
	getStats(): {
		totalPlayers: number;
		activePlayers: number;
		idlePlayers: number;
	} {
		let activePlayers = 0;
		let idlePlayers = 0;

		for (const player of this.players.values()) {
			if (player.state.status === AudioPlayerStatus.Playing) {
				activePlayers++;
			} else if (player.state.status === AudioPlayerStatus.Idle) {
				idlePlayers++;
			}
		}

		return {
			totalPlayers: this.players.size,
			activePlayers,
			idlePlayers,
		};
	}
}

export const audioPlayerManager = new AudioPlayerManager();
