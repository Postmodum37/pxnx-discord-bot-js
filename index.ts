import fs from "node:fs";
import path from "node:path";
import { generateDependencyReport } from "@discordjs/voice";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import type { ExtendedClient } from "./types/extendedClient";
import { config } from "./utils/config";

const client: ExtendedClient = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
}) as ExtendedClient;

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs
	.readdirSync(foldersPath)
	.filter((folder) =>
		fs.statSync(path.join(foldersPath, folder)).isDirectory(),
	);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith(".ts")); // Look for TypeScript files

	for (const file of commandFiles) {
		const tsFilePath = path.join(commandsPath, file);
		const { default: command } = require(tsFilePath); // Import commands using default import

		if ("data" in command && "execute" in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(
				`[WARNING] The command at ${tsFilePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith(".ts")); // Loading `.ts` files for events

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const { default: event } = require(filePath); // Importing the event

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

console.log(generateDependencyReport());

client.login(config.token);
