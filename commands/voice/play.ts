import { type DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	ComponentType,
	type GuildMember,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import { logger } from "../../utils/logger";
import { type QueueItem, queueService } from "../../utils/queueService";
import {
	ValidationError,
	validateGuildId,
	validateString,
	validateVoiceChannel,
} from "../../utils/validation";
import { type SearchResult, YouTubeService } from "../../utils/youtubeService";

const youtubeService = YouTubeService.getInstance(5);
const SELECTION_TIMEOUT = 30000;

async function createSearchInterface(
	searchResults: SearchResult[],
): Promise<{ buttons: ActionRowBuilder<ButtonBuilder>; resultsList: string }> {
	const buttons = searchResults.map((_, index) =>
		new ButtonBuilder()
			.setCustomId(`select_${index}`)
			.setLabel(`${index + 1}`)
			.setStyle(ButtonStyle.Primary),
	);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

	const resultsList = searchResults
		.map((item, index) => `${index + 1}. ${item.title} (${item.duration})`)
		.join("\n");

	return { buttons: row, resultsList };
}

async function handleSongSelection(
	interaction: ChatInputCommandInteraction,
	searchResults: SearchResult[],
	guildId: string,
	voiceChannel: NonNullable<GuildMember["voice"]["channel"]>,
): Promise<void> {
	const { buttons, resultsList } = await createSearchInterface(searchResults);

	const response = await interaction.editReply({
		content: `Select a song to play:\n${resultsList}`,
		components: [buttons],
	});

	const collector = response.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: SELECTION_TIMEOUT,
	});

	collector.on("collect", async (buttonInteraction) => {
		try {
			if (buttonInteraction.user.id !== interaction.user.id) {
				await buttonInteraction.reply({
					content: "You cannot use these buttons.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const idParts = buttonInteraction.customId.split("_");
			if (idParts.length !== 2 || !idParts[1]) {
				await buttonInteraction.reply({
					content: "Invalid button selection.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			const selectedIndex = Number.parseInt(idParts[1]);
			const selectedVideo = searchResults[selectedIndex];

			if (!selectedVideo) {
				await buttonInteraction.reply({
					content: "Invalid selection.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const song: QueueItem = {
				url: selectedVideo.url,
				title: selectedVideo.title,
				requestedBy: interaction.user.tag,
				addedAt: new Date(),
			};

			queueService.addToQueue(guildId, song);
			const queueLength = queueService.getQueue(guildId).length;

			await buttonInteraction.update({
				content:
					queueLength === 1
						? `▶️ Playing: ${song.title}`
						: `➕ Added to queue: ${song.title} (Position ${queueLength})`,
				components: [],
			});

			if (queueLength === 1) {
				const connection = joinVoiceChannel({
					channelId: voiceChannel.id,
					guildId,
					adapterCreator: interaction.guild?.voiceAdapterCreator as DiscordGatewayAdapterCreator,
				});

				await queueService.playNext(guildId, connection, interaction);
			}
		} catch (error) {
			logger.error("Error handling song selection", error as Error, {
				userId: buttonInteraction.user.id,
				guildId,
			});

			try {
				await buttonInteraction.reply({
					content: "An error occurred while processing your selection.",
					flags: MessageFlags.Ephemeral,
				});
			} catch (replyError) {
				logger.error("Failed to send error reply", replyError as Error);
			}
		}
	});

	collector.on("end", async (collected) => {
		if (collected.size === 0) {
			try {
				await interaction.editReply({
					content: "⏰ Selection timed out.",
					components: [],
				});
			} catch (error) {
				logger.error("Failed to update interaction on timeout", error as Error);
			}
		}
	});
}

const command: ChatCommand = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("Play a song from YouTube")
		.addStringOption((option) =>
			option.setName("song").setDescription("The name of the song to play").setRequired(true),
		) as SlashCommandBuilder,

	async execute(interaction: ChatInputCommandInteraction) {
		try {
			const songName = validateString(interaction.options.getString("song"), "Song name");
			const member = interaction.member as GuildMember;
			const voiceChannel = validateVoiceChannel(member);
			const guildId = validateGuildId(interaction.guildId);

			await interaction.deferReply();

			let searchResults: SearchResult[];

			try {
				searchResults = await youtubeService.search(songName);
			} catch (searchError) {
				const searchErrorMessage = (searchError as Error).message;

				// Handle signature decipher failures with detailed message
				if (searchErrorMessage.includes("YouTube playback is currently unavailable")) {
					await interaction.editReply(searchErrorMessage);
					return;
				}

				// Re-throw other errors to be handled by outer catch
				throw searchError;
			}

			if (searchResults.length === 0) {
				await interaction.editReply("❌ No results found for your search.");
				return;
			}

			await handleSongSelection(interaction, searchResults, guildId, voiceChannel);
		} catch (error) {
			logger.error("Play command failed", error as Error, {
				userId: interaction.user.id,
				guildId: interaction.guildId,
			});

			const errorMessage =
				error instanceof ValidationError
					? error.message
					: "❌ An error occurred while processing your request.";

			try {
				if (interaction.deferred) {
					await interaction.editReply(errorMessage);
				} else {
					await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
				}
			} catch (replyError) {
				logger.error("Failed to send error message", replyError as Error);
			}
		}
	},
};

export default command;
