const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Returns information about the user"),
  async execute(interaction) {
    const user = interaction.user;
    const member = await interaction.guild.members.fetch(user.id);
    const joinedDate = member.joinedAt;

    await interaction.reply(
      `Username: ${user.displayName}\nTag: ${user.tag}\nID: ${user.id}\nJoined Date: ${joinedDate}`
    );
  },
};
