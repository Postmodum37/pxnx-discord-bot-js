import { SlashCommandBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import { createEmbedWithFields } from "../../utils/embedFactory";

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

		const embed = createEmbedWithFields(
			"Server Information",
			"Here is some information about the server",
			[
				{ name: "Server name:", value: guild.name, inline: true },
				{
					name: "Total members:",
					value: guild.memberCount.toString(),
				},
				{
					name: "Created at:",
					value: guild.createdAt.toDateString(),
				},
				{
					name: "Owner:",
					value: await guild.fetchOwner().then((owner) => owner.user.tag),
				},
			],
		);

		await interaction.reply({ embeds: [embed] });
	},
};

export default command;
