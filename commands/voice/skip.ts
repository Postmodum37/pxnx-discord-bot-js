import { SlashCommandBuilder } from "@discordjs/builders";
import { getVoiceConnection } from "@discordjs/voice";
import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import { queueService } from "../../utils/queueService";

const command: ChatCommand = {
	data: new SlashCommandBuilder().setName("skip").setDescription("Skips the current playing song"),

	async execute(interaction: ChatInputCommandInteraction) {
		const member = interaction.member as GuildMember;
		const voiceChannel = member.voice.channel;

		if (!voiceChannel) {
			await interaction.reply("You need to be in a voice channel to skip music!");
			return;
		}

		const guildId = interaction.guildId as string;
		const connection = getVoiceConnection(guildId);

		if (!connection) {
			await interaction.reply("Nothing is playing right now.");
			return;
		}

		// Add these lines to handle queue properly
		const queue = queueService.getQueue(guildId);
		if (!queue.length) {
			await interaction.reply("The queue is empty.");
			return;
		}

		queueService.removeFromQueue(guildId);
		await queueService.playNext(guildId, connection, interaction);
		await interaction.reply("Skipped the current song.");
	},
};

export default command;
