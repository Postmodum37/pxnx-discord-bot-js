import {
	type ChatInputCommandInteraction,
	type GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import { createEmbedWithFields } from "../../utils/embedFactory";

const command: ChatCommand = {
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("Replies with user info!"),
	async execute(interaction: ChatInputCommandInteraction) {
		const user = interaction.user;
		const member = interaction.member as GuildMember;

		const embed = createEmbedWithFields(
			"User Information",
			"Here's your user information:",
			[
				{ name: "Username:", value: user.username },
				{ name: "ID:", value: user.id },
				{
					name: "Created at:",
					value: user.createdAt.toDateString(),
				},
				{
					name: "Joined Discord:",
					value: member.joinedAt?.toDateString() ?? "Unknown",
				},
				{
					name: "Roles:",
					value: member.roles.cache.map((role) => role.name).join(", "),
				},
			],
		);

		await interaction.reply({ embeds: [embed] });
	},
};

export default command;
