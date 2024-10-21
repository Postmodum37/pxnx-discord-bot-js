import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";

const command = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Replies with user info!"),
  async execute(interaction: CommandInteraction) {
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
