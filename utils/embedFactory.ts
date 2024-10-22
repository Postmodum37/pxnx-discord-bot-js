import { type APIEmbedField, type ColorResolvable, EmbedBuilder } from "discord.js";

export function createBasicEmbed(
	title: string,
	description: string,
	color: ColorResolvable = "#5865f2",
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
	color: ColorResolvable = "#5865f2",
) {
	return new EmbedBuilder()
		.setTitle(title)
		.setDescription(description)
		.addFields(fields)
		.setColor(color);
}
