import path from "node:path";
import { generateDependencyReport } from "@discordjs/voice";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import type { ExtendedClient } from "./types/extendedClient";
import { CommandLoader } from "./utils/commandLoader";
import { config } from "./utils/config";
import { EventLoader } from "./utils/eventLoader";
import { logger } from "./utils/logger";

async function initializeBot(): Promise<void> {
	try {
		// Create client instance
		const client: ExtendedClient = new Client({
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
		}) as ExtendedClient;

		client.commands = new Collection();

		// Initialize loaders
		const commandLoader = new CommandLoader(path.join(__dirname, "commands"));
		const eventLoader = new EventLoader(path.join(__dirname, "events"));

		// Load commands and events
		await commandLoader.loadCommands(client);
		await eventLoader.loadEvents(client);

		// Log voice dependency info
		logger.info("Voice dependency report", {
			report: generateDependencyReport(),
		});

		// Login to Discord
		await client.login(config.token);
	} catch (error) {
		logger.error("Failed to initialize bot", error as Error);
		process.exit(1);
	}
}

// Handle unhandled rejections and uncaught exceptions
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection", new Error(String(reason)), {
		promise: promise.toString(),
	});
});

process.on("uncaughtException", (error) => {
	logger.error("Uncaught Exception", error);
	process.exit(1);
});

// Initialize the bot
initializeBot();
