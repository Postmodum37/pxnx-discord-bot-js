import { SlashCommandBuilder } from "@discordjs/builders";
import { getVoiceConnection } from "@discordjs/voice";
import type { CommandInteraction, GuildMember } from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";

const command: ChatCommand = {
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stops the current playing song in the voice channel"),

	async execute(interaction: CommandInteraction) {
		const member = interaction.member as GuildMember;
		const voiceChannel = member.voice.channel;

		if (!voiceChannel) {
			await interaction.reply(
				"You need to be in a voice channel to stop the music!",
			);
			return;
		}

		const connection = getVoiceConnection(voiceChannel.guild.id);

		if (!connection) {
			await interaction.reply("There is no song currently playing.");
			return;
		}

		connection.destroy();
		await interaction.reply("Stopped the music and left the voice channel.");
	},
};

export default command;
