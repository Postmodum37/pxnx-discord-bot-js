import {
	type APIEmbedField,
	type ColorResolvable,
	EmbedBuilder,
} from "discord.js";

const baseColor = "#5865f2";

export function createBasicEmbed(
	title: string,
	description: string,
	color: ColorResolvable = baseColor,
) {
	return new EmbedBuilder()
		.setTitle(title)
		.setDescription(description)
		.setColor(color);
}

export function createEmbedWithFields(
	title: string,
	description: string,
	fields: APIEmbedField[],
	color: ColorResolvable = baseColor,
) {
	return new EmbedBuilder()
		.setTitle(title)
		.setDescription(description)
		.addFields(fields)
		.setColor(color);
}

export function createWeatherEmbed(
	city: string,
	weatherData: {
		main: { temp: number; humidity: number };
		weather: Array<{ main: string; description: string }>;
		wind: { speed: number };
	},
	color: ColorResolvable = baseColor,
): EmbedBuilder {
	const fields: APIEmbedField[] = [
		{
			name: "Temperature",
			value: `${weatherData.main.temp.toFixed(1)}°C`,
			inline: true,
		},
		{
			name: "Condition",
			value: weatherData.weather[0].main,
			inline: true,
		},
		{
			name: "Description",
			value: weatherData.weather[0].description,
			inline: true,
		},
		{
			name: "Humidity",
			value: `${weatherData.main.humidity}%`,
			inline: true,
		},
		{
			name: "Wind Speed",
			value: `${weatherData.wind.speed} m/s`,
			inline: true,
		},
	];

	return createEmbedWithFields(
		`Weather Forecast for ${city}`,
		"Here's the current weather:",
		fields,
		color,
	)
		.setTimestamp()
		.setFooter({ text: "Data provided by OpenWeatherMap" });
}
