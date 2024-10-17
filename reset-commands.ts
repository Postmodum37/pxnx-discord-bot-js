import { REST, Routes } from "discord.js";
import { config } from "./utils/config";

const rest = new REST({ version: "10" }).setToken(config.token);

async function deleteCommands(endPoint: `/${string}`, message: string) {
  try {
    await rest.put(endPoint, { body: [] });
    console.log(message);
  } catch (error) {
    console.error(error);
  }
}

// Delete guild-based commands
deleteCommands(
  Routes.applicationGuildCommands(config.clientId, config.guildId),
  "Successfully deleted all guild commands."
);

// Delete global commands
deleteCommands(
  Routes.applicationCommands(config.clientId),
  "Successfully deleted all application commands."
);
