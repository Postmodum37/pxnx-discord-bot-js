import { SlashCommandBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import { queueService } from "../../utils/queueService";

const command: ChatCommand = {
	data: new SlashCommandBuilder()
		.setName("next")
		.setDescription("Shows the next song in the queue"),

	async execute(interaction: ChatInputCommandInteraction) {
		const guildId = interaction.guildId as string;
		const queue = queueService.getQueue(guildId);

		if (queue.length < 2) {
			await interaction.reply("There are no songs coming up next.");
			return;
		}

		const nextSong = queue[1];
		await interaction.reply(
			`Next up: ${nextSong.title} (requested by ${nextSong.requestedBy})`,
		);
	},
};

export default command;
