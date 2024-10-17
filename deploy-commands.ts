import { REST, Routes } from "discord.js";
import type { ApplicationCommandData } from "discord.js";
import fs from "node:fs";
import path from "node:path";

import { config } from "./utils/config";

const commands: ApplicationCommandData[] = [];

// Function to load commands from the file system
async function loadCommands() {
  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = await import(filePath);

      if (command.data && command.execute) {
        commands.push(command.data.toJSON());
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }
}

// Function to deploy commands
async function deployCommands() {
  const rest = new REST().setToken(config.token);

  try {
    console.log(
      `Started refreshing ${commands.length} application and guild (/) commands.`
    );

    // Deploy commands to a specified guild
    const guildData = (await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    )) as ApplicationCommandData[];

    console.log(
      `Successfully reloaded ${guildData.length} guild (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  await loadCommands();
  await deployCommands();
})();
