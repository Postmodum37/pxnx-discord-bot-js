import { type ColorResolvable, EmbedBuilder } from "discord.js";

function createBasicEmbed(
	title: string,
	description: string,
	color: ColorResolvable = "#5865f2",
) {
	return new EmbedBuilder()
		.setTitle(title)
		.setDescription(description)
		.setColor(color);
}

export default createBasicEmbed;
