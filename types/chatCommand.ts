import type { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface ChatCommand {
	data: SlashCommandBuilder;
	execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
