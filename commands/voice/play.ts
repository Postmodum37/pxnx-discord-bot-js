import {
	AudioPlayerStatus,
	type DiscordGatewayAdapterCreator,
	NoSubscriberBehavior,
	VoiceConnectionStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	joinVoiceChannel,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import ytsr from "@distube/ytsr";
import {
	type ChatInputCommandInteraction,
	type GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";

const command: ChatCommand = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("Play a song from YouTube")
		.addStringOption((option) =>
			option
				.setName("song")
				.setDescription("The name of the song to play")
				.setRequired(true),
		) as SlashCommandBuilder,

	async execute(interaction: ChatInputCommandInteraction) {
		const songName = interaction.options.getString("song", true);
		if (!songName) {
			await interaction.reply("You need to provide a song name!");
			return;
		}

		const member = interaction.member as GuildMember;
		const voiceChannel = member.voice.channel;

		if (!voiceChannel) {
			await interaction.reply(
				"You need to be in a voice channel to play music!",
			);
			return;
		}

		const searchResults = await ytsr(songName, { limit: 1 });
		const video = searchResults.items.find((item) => item.type === "video");

		if (!video) {
			await interaction.reply("No video found for the provided song name.");
			return;
		}

		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild
				.voiceAdapterCreator as DiscordGatewayAdapterCreator,
		});

		const stream = ytdl(video.url, { filter: "audioonly" });
		const resource = createAudioResource(stream);
		const player = createAudioPlayer({
			behaviors: {
				noSubscriber: NoSubscriberBehavior.Play,
			},
		});

		// Debugging

		connection.on("stateChange", (oldState, newState) => {
			console.log(
				`Connection transitioned from ${oldState.status} to ${newState.status}`,
			);
		});

		player.on("stateChange", (oldState, newState) => {
			console.log(
				`Audio player transitioned from ${oldState.status} to ${newState.status}`,
			);
		});

		connection.on(
			VoiceConnectionStatus.Disconnected,
			async (oldState, newState) => {
				try {
					await Promise.race([
						entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
						entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
					]);
					// Seems to be reconnecting to a new channel - ignore disconnect
				} catch (error) {
					// Seems to be a real disconnect which SHOULDN'T be recovered from
					connection.destroy();
				}
			},
		);

		player.play(resource);
		connection.subscribe(player);

		player.on(AudioPlayerStatus.Playing, () => {
			console.log(`Now playing: ${video.name}`);
			interaction.reply(`Now playing: ${video.name}`);
		});

		player.on(AudioPlayerStatus.Idle, () => {
			connection.destroy();
		});

		player.on(AudioPlayerStatus.AutoPaused, () => {
			connection.destroy();
		});

		player.on("error", (error) => {
			console.error(error);
			interaction.reply("An error occurred while trying to play the song.");
			connection.destroy();
		});
	},
};

export default command;
