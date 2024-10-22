import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import { createWeatherEmbed } from "../../utils/embedFactory";

const API_KEY = process.env.OPENWEATHERMAP_API_KEY;

interface WeatherData {
	main: {
		temp: number;
		humidity: number;
	};
	weather: Array<{
		main: string;
		description: string;
	}>;
	wind: {
		speed: number;
	};
}

async function getWeatherData(city: string): Promise<WeatherData> {
	const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
	const response = await fetch(url);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(`Failed to fetch weather data: ${errorData.message}`);
	}
	return response.json();
}

const command: ChatCommand = {
	data: new SlashCommandBuilder()
		.setName("weather")
		.setDescription("Get the weather forecast for a city")
		.addStringOption((option) =>
			option
				.setName("city")
				.setDescription("The city to get weather for")
				.setRequired(true),
		) as SlashCommandBuilder,

	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();

		const city = interaction.options.getString("city", true);

		try {
			const weatherData = await getWeatherData(city);
			const embed = createWeatherEmbed(city, weatherData);
			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error("Error fetching weather data:", error);
			await interaction.editReply(
				"Sorry, I couldn't fetch the weather data for that city. Please check the city name and try again.",
			);
		}
	},
};

export default command;
