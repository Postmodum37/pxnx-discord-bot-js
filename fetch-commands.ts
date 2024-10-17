import { REST, Routes } from "discord.js";
import { config } from "./utils/config";

const rest = new REST({ version: "9" }).setToken(config.token);

async function fetchGuildCommands(clientId: string, guildId: string) {
  try {
    console.log("Fetching guild commands...");
    const guildCommands = await rest.get(
      Routes.applicationGuildCommands(clientId, guildId)
    );
    console.log("Guild commands:", guildCommands);
    return guildCommands; // Optional: Return data if these functions will be used elsewhere that requires the data
  } catch (error) {
    console.error("Failed to fetch guild commands:", error);
    throw error; // Re-throw to handle it further up if necessary
  }
}

async function fetchGlobalCommands(clientId: string) {
  try {
    console.log("Fetching global commands...");
    const globalCommands = await rest.get(Routes.applicationCommands(clientId));
    console.log("Global commands:", globalCommands);
    return globalCommands; // Optional: Return data if these functions will be used elsewhere that requires the data
  } catch (error) {
    console.error("Failed to fetch global commands:", error);
    throw error; // Re-throw to handle it further up if necessary
  }
}

(async () => {
  try {
    await fetchGuildCommands(config.clientId, config.guildId);
    await fetchGlobalCommands(config.clientId);
  } catch (error) {
    // Any re-thrown errors will be caught here
    console.error("An error occurred while fetching commands:", error);
  }
})();
