import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	type ChatInputCommandInteraction,
	type MessageComponentInteraction, // Import general type for message component interactions
	SlashCommandBuilder,
} from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import { createBasicEmbed } from "../../utils/embedFactory";
import getRandomElement from "../../utils/randomElement";

const command: ChatCommand = {
	data: new SlashCommandBuilder()
		.setName("coinflip")
		.setDescription("Flip a coin and choose heads or tails"),

	async execute(interaction: ChatInputCommandInteraction) {
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder().setCustomId("heads").setLabel("Heads").setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId("tails").setLabel("Tails").setStyle(ButtonStyle.Primary),
		);

		const embed = createBasicEmbed("Coin Flip", "Choose heads or tails by clicking a button.");

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});

		const response = await interaction.fetchReply();

		// Define the collector filter to accept any MessageComponentInteraction and check if the user ID matches
		const collectorFilter = (i: MessageComponentInteraction): boolean =>
			i.user.id === interaction.user.id;

		try {
			const userSelection = (await response.awaitMessageComponent({
				filter: collectorFilter,
				time: 15000,
			})) as ButtonInteraction; // Expecting a ButtonInteraction as a result

			const selectedSide = userSelection.customId;
			const coinSides = ["heads", "tails"];
			const randomSide = getRandomElement(coinSides);
			let resultMessage = `You chose ${selectedSide}. The coin landed on ${randomSide}.`;

			if (selectedSide === randomSide) {
				resultMessage += " You win!";
			} else {
				resultMessage += " You lose!";
			}

			const resultEmbed = createBasicEmbed("Coin Flip Result", resultMessage);

			await userSelection.update({
				components: [],
				embeds: [resultEmbed],
			});
		} catch {
			await interaction.editReply({
				content: "Confirmation not received within 15 seconds, cancelling",
				components: [],
				embeds: [],
			});
		}
	},
};

export default command;
