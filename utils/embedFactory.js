const { EmbedBuilder } = require("discord.js");

const EmbedFactory = {
	createBasicEmbed(title, description, color = "#5865f2") {
		return new EmbedBuilder()
			.setTitle(title)
			.setDescription(description)
			.setColor(color);
	},
};

module.exports = EmbedFactory;
