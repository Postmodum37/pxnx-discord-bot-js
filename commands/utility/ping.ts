import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import { logger } from "../../utils/logger";

const command: ChatCommand = {
	data: new SlashCommandBuilder().setName("ping").setDescription("Replies with bot latency"),

	async execute(interaction: ChatInputCommandInteraction) {
		try {
			// sending initial response to command
			const sent = await interaction.reply({
				content: "🏓 Pinging...",
				fetchReply: true,
			});

			// calculating latency and editing the reply
			const latency = sent.createdTimestamp - interaction.createdTimestamp;
			const apiLatency = interaction.client.ws.ping;

			logger.debug("Ping command executed", {
				userId: interaction.user.id,
				latency,
				apiLatency,
			});

			await interaction.editReply(
				`🏓 Pong!\n📊 **Bot Latency:** ${latency}ms\n🌐 **API Latency:** ${apiLatency}ms`,
			);
		} catch (error) {
			logger.error("Failed to execute ping command", error as Error, {
				userId: interaction.user.id,
			});

			try {
				await interaction.reply({
					content: "❌ Failed to measure latency.",
					ephemeral: true,
				});
			} catch (replyError) {
				logger.error("Failed to send ping error reply", replyError as Error);
			}
		}
	},
};

export default command;
