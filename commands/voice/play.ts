import {
	type DiscordGatewayAdapterCreator,
	joinVoiceChannel,
} from "@discordjs/voice";
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
import { type QueueItem, queueService } from "../../utils/queueService";

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

		const searchResults = await ytsr(songName, { limit: 5 });

		if (!searchResults.items.length) {
			await interaction.reply("No results found!");
			return;
		}

		const buttons = searchResults.items.map((_item, index) => {
			return new ButtonBuilder()
				.setCustomId(`select_${index}`)
				.setLabel(`${index + 1}`)
				.setStyle(ButtonStyle.Primary);
		});

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

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

				const guildId = interaction.guildId as string;

				const song: QueueItem = {
					url: selectedVideo.url,
					title: selectedVideo.name,
					requestedBy: interaction.user.tag,
				};

				queueService.addToQueue(guildId, song);
				const queueLength = queueService.getQueue(guildId).length;

				await i.update({
					content:
						queueLength === 1
							? `Playing: ${song.title}`
							: `Added to queue: ${song.title}`,
					components: [],
				});

				if (queueLength === 1) {
					const connection = joinVoiceChannel({
						channelId: voiceChannel.id,
						guildId: guildId,
						adapterCreator: interaction.guild
							?.voiceAdapterCreator as DiscordGatewayAdapterCreator,
					});

					await queueService.playNext(guildId, connection, interaction);
				}
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
