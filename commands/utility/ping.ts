import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

const command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with bot latency"),

  async execute(interaction: CommandInteraction): Promise<void> {
    try {
      // sending initial response to command
      const sent = await interaction.reply({
        content: "Pinging...",
        fetchReply: true,
      });

      // calculating latency and editing the reply
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      await interaction.editReply(`Pong! Latency is ${latency}ms.`);
    } catch (error) {
      console.error("Failed to execute ping command:", error);
      await interaction.reply({
        content: "Failed to measure latency.",
        ephemeral: true, // makes the reply only visible to the user
      });
    }
  },
};

export default command;
