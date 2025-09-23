import { Events, type Interaction } from "discord.js";
import type { ChatCommand } from "../types/chatCommand";
import type { ExtendedClient } from "../types/extendedClient";
import { logger } from "../utils/logger";

const event = {
	name: Events.InteractionCreate,
	async execute(interaction: Interaction) {
		if (!interaction.isChatInputCommand()) return;

		const client = interaction.client as ExtendedClient;
		const command = client.commands.get(interaction.commandName) as ChatCommand | undefined;

		if (!command) {
			logger.error("Command not found", undefined, {
				commandName: interaction.commandName,
				userId: interaction.user.id,
				guildId: interaction.guildId,
			});
			return;
		}

		try {
			logger.debug("Executing command", {
				commandName: interaction.commandName,
				userId: interaction.user.id,
				username: interaction.user.username,
				guildId: interaction.guildId,
			});

			await command.execute(interaction);

			logger.debug("Command executed successfully", {
				commandName: interaction.commandName,
				userId: interaction.user.id,
			});
		} catch (error) {
			logger.error("Command execution failed", error as Error, {
				commandName: interaction.commandName,
				userId: interaction.user.id,
				guildId: interaction.guildId,
			});

			const errorMessage = "There was an error while executing this command!";

			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: errorMessage,
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						content: errorMessage,
						ephemeral: true,
					});
				}
			} catch (replyError) {
				logger.error("Failed to send error message to user", replyError as Error, {
					commandName: interaction.commandName,
					userId: interaction.user.id,
				});
			}
		}
	},
};

export default event;
