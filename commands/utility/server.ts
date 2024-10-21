import { SlashCommandBuilder } from "@discordjs/builders";
import type { CommandInteraction } from "discord.js";

const command = {
	data: new SlashCommandBuilder()
		.setName("server")
		.setDescription("Provides information about the server"),
	async execute(interaction: CommandInteraction) {
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
