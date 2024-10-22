import { SlashCommandBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";

const command: ChatCommand = {
	data: new SlashCommandBuilder()
		.setName("server")
		.setDescription("Provides information about the server"),
	async execute(interaction: ChatInputCommandInteraction) {
		const { guild } = interaction;
		if (!guild) {
			await interaction.reply("This command can only be used in a server.");
			return;
		}

		// TODO: Fix formatting and add more details
		const serverInfo = `
      Server name: ${guild.name}
      Total members: ${guild.memberCount}
      Created at: ${guild.createdAt.toDateString()}
      Owner: ${await guild.fetchOwner().then((owner) => owner.user.tag)}
    `;

		await interaction.reply(serverInfo);
	},
};

export default command;
