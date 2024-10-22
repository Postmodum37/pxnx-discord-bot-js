import {
	type ChatInputCommandInteraction,
	type GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";

const command: ChatCommand = {
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("Replies with user info!"),
	async execute(interaction: ChatInputCommandInteraction) {
		const user = interaction.user;
		const member = interaction.member as GuildMember;

		// TODO: Fix formatting and add more details
		const userInfo = `
            **Username:** ${user.displayName}
            **ID:** ${user.id}
            **Joined Discord:** ${user.createdAt.toDateString()}
            **Joined Server:** ${member.joinedAt?.toDateString()}
            **Roles:** ${member.roles.cache.map((role) => role.name).join(", ")}
        `;

		await interaction.reply(userInfo);
	},
};

export default command;
