const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require("discord.js");
const getRandomElement = require("../../utils/randomElement");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip a coin and choose heads or tails"),
  /**
   * @param {CommandInteraction} interaction
   */
  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("heads")
        .setLabel("Heads")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("tails")
        .setLabel("Tails")
        .setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Coin Flip")
      .setDescription("Choose heads or tails by clicking a button.");

    await interaction.reply({ embeds: [embed], components: [row] });

    const filter = (i) => i.customId === "heads" || i.customId === "tails";
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id === interaction.user.id) {
        const userChoice = i.customId;
        const coinSides = ["heads", "tails"];
        const randomSide = getRandomElement(coinSides);

        let resultMessage = `You chose ${userChoice}. The coin landed on ${randomSide}.`;

        if (userChoice === randomSide) {
          resultMessage += " You win!";
        } else {
          resultMessage += " You lose!";
        }

        const resultEmbed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Coin Flip Result")
          .setDescription(resultMessage);

        await i.update({ embeds: [resultEmbed], components: [] });
        collector.stop();
      } else {
        await i.reply({
          content: "This button is not for you!",
          ephemeral: true,
        });
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: "No one chose a side in time!",
          components: [],
        });
      }
    });
  },
};
