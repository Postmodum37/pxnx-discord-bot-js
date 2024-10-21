const { SlashCommandBuilder } = require("@discordjs/builders");
const {
	CommandInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const EmbedFactory = require("../../utils/embedFactory");
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
				.setStyle(ButtonStyle.Primary),
		);

		const embed = EmbedFactory.createBasicEmbed(
			"Coin Flip",
			"Choose heads or tails by clicking a button.",
		);

		const response = await interaction.reply({
			embeds: [embed],
			components: [row],
		});

		const collectorFilter = (i) => i.user.id === interaction.user.id;

		try {
			const userSelection = await response.awaitMessageComponent({
				filter: collectorFilter,
				time: 15_000,
			});

			const selectedSide = userSelection.customId;
			const coinSides = ["heads", "tails"];
			const randomSide = getRandomElement(coinSides);
			let resultMessage = `You chose ${selectedSide}. The coin landed on ${randomSide}.`;

			if (selectedSide === randomSide) {
				resultMessage += " You win!";
			} else {
				resultMessage += " You lose!";
			}

			const resultEmbed = EmbedFactory.createBasicEmbed(
				"Coin Flip Result",
				resultMessage,
			);

			await userSelection.update({
				components: [],
				embeds: [resultEmbed],
			});
		} catch (e) {
			await interaction.editReply({
				content: "Confirmation not received within 15 seconds, cancelling",
				components: [],
				embeds: [],
			});
		}
	},
};
