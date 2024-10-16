const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Provides information about the server"),
  async execute(interaction) {
    const { guild } = interaction;
    await interaction.reply(
      `Server name: ${guild.name}\nTotal members: ${guild.memberCount}\nCreated at: ${guild.createdAt}`
    );
  },
};
