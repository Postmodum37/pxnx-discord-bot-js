import fs from "node:fs";
import path from "node:path";
import type { ApplicationCommandData } from "discord.js";
import { REST, Routes } from "discord.js";

import { config } from "./utils/config";

const commands: ApplicationCommandData[] = [];

// Function to load commands from the file system
async function loadCommands() {
	const foldersPath = path.join(__dirname, "commands");
	const commandFolders = fs
		.readdirSync(foldersPath)
		.filter((folder) => fs.statSync(path.join(foldersPath, folder)).isDirectory());

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = await import(filePath);

			if (command.default?.data && command.default.execute) {
				commands.push(command.default.data.toJSON());
			} else {
				console.log(
					`[WARNING] The TypeScript command at ${filePath} is missing a required "default" or "data" or "execute" property.`,
				);
			}
		}
	}
}

// Function to deploy commands
async function deployCommands() {
	const rest = new REST().setToken(config.token);

	try {
		console.log(`Started refreshing ${commands.length} application and guild (/) commands.`);

		// Deploy commands to a specified guild
		const guildData = (await rest.put(
			Routes.applicationGuildCommands(config.clientId, config.guildId),
			{ body: commands },
		)) as ApplicationCommandData[];

		console.log(`Successfully reloaded ${guildData.length} guild (/) commands.`);
		process.exit(0);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

(async () => {
	await loadCommands();
	await deployCommands();
})();
