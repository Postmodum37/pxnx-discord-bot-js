import {
	AudioPlayerStatus,
	NoSubscriberBehavior,
	type VoiceConnection,
	createAudioPlayer,
	createAudioResource,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import type { ChatInputCommandInteraction } from "discord.js";

export interface QueueItem {
	url: string;
	title: string;
	requestedBy: string;
}

class QueueService {
	private queues = new Map<string, QueueItem[]>();

	addToQueue(guildId: string, item: QueueItem) {
		if (!this.queues.has(guildId)) {
			this.queues.set(guildId, []);
		}
		this.queues.get(guildId)?.push(item);
	}

	removeFromQueue(guildId: string) {
		const queue = this.queues.get(guildId);
		if (queue) {
			return queue.shift();
		}
		return null;
	}

	getQueue(guildId: string): QueueItem[] {
		return this.queues.get(guildId) || [];
	}

	clearQueue(guildId: string) {
		this.queues.set(guildId, []);
	}

	async playNext(
		guildId: string,
		connection: VoiceConnection,
		interaction: ChatInputCommandInteraction,
	) {
		const queue = this.queues.get(guildId);
		if (!queue?.length) {
			try {
				if (connection.state.status !== 'destroyed') {
					connection.destroy();
				}
			} catch (error) {
				console.error('Error while destroying connection:', error);
			}
			this.clearQueue(guildId);
			return;
		}

		try {
			const nextSong = queue[0];
			const stream = ytdl(nextSong.url, { filter: "audioonly" });
			const resource = createAudioResource(stream);
			const player = createAudioPlayer({
				behaviors: {
					noSubscriber: NoSubscriberBehavior.Play,
				},
			});

			player.play(resource);
			connection.subscribe(player);

			player.on(AudioPlayerStatus.Idle, () => {
				this.removeFromQueue(guildId);
				this.playNext(guildId, connection, interaction);
			});

			player.on("error", (error) => {
				console.error(error);
				this.removeFromQueue(guildId);
				this.playNext(guildId, connection, interaction);
			});
		} catch (error) {
			console.error("Error playing song:", error);
			this.removeFromQueue(guildId);
			this.playNext(guildId, connection, interaction);
		}
	}
}

export const queueService = new QueueService();
