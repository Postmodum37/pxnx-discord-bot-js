import { SlashCommandBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import { queueService } from "../../utils/queueService";

const command: ChatCommand = {
	data: new SlashCommandBuilder().setName("queue").setDescription("Shows the current music queue"),

	async execute(interaction: ChatInputCommandInteraction) {
		const guildId = interaction.guildId as string;
		const queue = queueService.getQueue(guildId);

		if (!queue.length) {
			await interaction.reply("The queue is empty.");
			return;
		}

		const queueList = queue
			.map((song, index) => `${index + 1}. ${song.title} (requested by ${song.requestedBy})`)
			.join("\n");

		await interaction.reply(`**Current Queue:**\n${queueList}`);
	},
};

export default command;
