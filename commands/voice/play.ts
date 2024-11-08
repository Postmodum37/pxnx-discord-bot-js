// import {
// 	AudioPlayerStatus,
// 	type DiscordGatewayAdapterCreator,
// 	NoSubscriberBehavior,
// 	VoiceConnectionStatus,
// 	createAudioPlayer,
// 	createAudioResource,
// 	entersState,
// 	joinVoiceChannel,
// } from "@discordjs/voice";
// import ytdl from "@distube/ytdl-core";
// import ytsr from "@distube/ytsr";
// import {
// 	type ChatInputCommandInteraction,
// 	type GuildMember,
// 	SlashCommandBuilder,
// } from "discord.js";
// import type { ChatCommand } from "../../types/chatCommand";

// const command: ChatCommand = {
// 	data: new SlashCommandBuilder()
// 		.setName("play")
// 		.setDescription("Play a song from YouTube")
// 		.addStringOption((option) =>
// 			option
// 				.setName("song")
// 				.setDescription("The name of the song to play")
// 				.setRequired(true),
// 		) as SlashCommandBuilder,

// 	async execute(interaction: ChatInputCommandInteraction) {
// 		const songName = interaction.options.getString("song", true);
// 		if (!songName) {
// 			await interaction.reply("You need to provide a song name!");
// 			return;
// 		}

// 		const member = interaction.member as GuildMember;
// 		const voiceChannel = member.voice.channel;

// 		if (!voiceChannel) {
// 			await interaction.reply(
// 				"You need to be in a voice channel to play music!",
// 			);
// 			return;
// 		}

// 		const searchResults = await ytsr(songName, { limit: 1 });
// 		const video = searchResults.items.find((item) => item.type === "video");

// 		if (!video) {
// 			await interaction.reply("No video found for the provided song name.");
// 			return;
// 		}

// 		const connection = joinVoiceChannel({
// 			channelId: voiceChannel.id,
// 			guildId: voiceChannel.guild.id,
// 			adapterCreator: voiceChannel.guild
// 				.voiceAdapterCreator as DiscordGatewayAdapterCreator,
// 		});

// 		const stream = ytdl(video.url, { filter: "audioonly" });
// 		const resource = createAudioResource(stream);
// 		const player = createAudioPlayer({
// 			behaviors: {
// 				noSubscriber: NoSubscriberBehavior.Play,
// 			},
// 		});

// 		// Debugging

// 		connection.on("stateChange", (oldState, newState) => {
// 			console.log(
// 				`Connection transitioned from ${oldState.status} to ${newState.status}`,
// 			);
// 		});

// 		player.on("stateChange", (oldState, newState) => {
// 			console.log(
// 				`Audio player transitioned from ${oldState.status} to ${newState.status}`,
// 			);
// 		});

// 		connection.on(
// 			VoiceConnectionStatus.Disconnected,
// 			async (oldState, newState) => {
// 				try {
// 					await Promise.race([
// 						entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
// 						entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
// 					]);
// 					// Seems to be reconnecting to a new channel - ignore disconnect
// 				} catch (error) {
// 					// Seems to be a real disconnect which SHOULDN'T be recovered from
// 					connection.destroy();
// 				}
// 			},
// 		);

// 		player.play(resource);
// 		connection.subscribe(player);

// 		player.on(AudioPlayerStatus.Playing, () => {
// 			console.log(`Now playing: ${video.name}`);
// 			interaction.reply(`Now playing: ${video.name}`);
// 		});

// 		player.on(AudioPlayerStatus.Idle, () => {
// 			connection.destroy();
// 		});

// 		player.on(AudioPlayerStatus.AutoPaused, () => {
// 			connection.destroy();
// 		});

// 		player.on("error", (error) => {
// 			console.error(error);
// 			interaction.reply("An error occurred while trying to play the song.");
// 			connection.destroy();
// 		});
// 	},
// };

// export default command;

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
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	ComponentType,
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
		const member = interaction.member as GuildMember;
		const voiceChannel = member.voice.channel;

		if (!voiceChannel) {
			await interaction.reply(
				"You need to be in a voice channel to play music!",
			);
			return;
		}

		// Search for songs
		const searchResults = await ytsr(songName, { limit: 5 });

		if (!searchResults.items.length) {
			await interaction.reply("No results found!");
			return;
		}

		// Create buttons for each result
		const buttons = searchResults.items.map((item, index) => {
			return new ButtonBuilder()
				.setCustomId(`select_${index}`)
				.setLabel(`${index + 1}`)
				.setStyle(ButtonStyle.Primary);
		});

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

		// Create the response message with results
		const resultsList = searchResults.items
			.map((item, index) => `${index + 1}. ${item.name} (${item.duration})`)
			.join("\n");

		const response = await interaction.reply({
			content: `Select a song to play:\n${resultsList}`,
			components: [row],
			fetchReply: true,
		});

		try {
			const collector = response.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 30000,
			});

			collector.on("collect", async (i) => {
				if (i.user.id !== interaction.user.id) {
					await i.reply({
						content: "You cannot use these buttons.",
						ephemeral: true,
					});
					return;
				}

				const selectedIndex = Number.parseInt(i.customId.split("_")[1]);
				const selectedVideo = searchResults.items[selectedIndex];

				await i.update({
					content: `Playing: ${selectedVideo.name}`,
					components: [],
				});

				const connection = joinVoiceChannel({
					channelId: voiceChannel.id,
					guildId: voiceChannel.guild.id,
					adapterCreator: voiceChannel.guild
						.voiceAdapterCreator as DiscordGatewayAdapterCreator,
				});

				const stream = ytdl(selectedVideo.url, { filter: "audioonly" });
				const resource = createAudioResource(stream);
				const player = createAudioPlayer({
					behaviors: {
						noSubscriber: NoSubscriberBehavior.Play,
					},
				});

				player.play(resource);
				connection.subscribe(player);
			});

			collector.on("end", async (collected) => {
				if (collected.size === 0) {
					await interaction.editReply({
						content: "Selection timed out.",
						components: [],
					});
				}
			});
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "An error occurred while processing your selection.",
				components: [],
			});
		}
	},
};

export default command;
