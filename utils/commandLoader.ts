import fs from "node:fs";
import path from "node:path";
import type { Collection } from "discord.js";
import type { ChatCommand } from "../types/chatCommand";
import type { ExtendedClient } from "../types/extendedClient";
import { logger } from "./logger";

export class CommandLoader {
	private readonly commandsPath: string;

	constructor(commandsPath: string) {
		this.commandsPath = commandsPath;
	}

	async loadCommands(client: ExtendedClient): Promise<void> {
		try {
			const commandFolders = await this.getCommandFolders();

			for (const folder of commandFolders) {
				await this.loadCommandsFromFolder(client.commands, folder);
			}

			logger.info(`Successfully loaded ${client.commands.size} commands`, {
				commands: Array.from(client.commands.keys()),
			});
		} catch (error) {
			logger.error("Failed to load commands", error as Error);
			throw error;
		}
	}

	private async getCommandFolders(): Promise<string[]> {
		const items = await fs.promises.readdir(this.commandsPath);
		const folders: string[] = [];

		for (const item of items) {
			const itemPath = path.join(this.commandsPath, item);
			const stats = await fs.promises.stat(itemPath);
			if (stats.isDirectory()) {
				folders.push(item);
			}
		}

		return folders;
	}

	private async loadCommandsFromFolder(
		commands: Collection<string, ChatCommand>,
		folderName: string,
	): Promise<void> {
		const folderPath = path.join(this.commandsPath, folderName);
		const commandFiles = await this.getCommandFiles(folderPath);

		logger.debug(`Loading commands from folder: ${folderName}`, {
			files: commandFiles,
		});

		for (const file of commandFiles) {
			await this.loadCommand(commands, folderPath, file);
		}
	}

	private async getCommandFiles(folderPath: string): Promise<string[]> {
		const files = await fs.promises.readdir(folderPath);
		return files.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
	}

	private async loadCommand(
		commands: Collection<string, ChatCommand>,
		folderPath: string,
		fileName: string,
	): Promise<void> {
		const filePath = path.join(folderPath, fileName);

		try {
			// Use dynamic import instead of require()
			const module = await import(filePath);
			const command = module.default as ChatCommand;

			if (!this.isValidCommand(command)) {
				logger.warn(`Invalid command structure in file: ${filePath}`, {
					hasData: "data" in command,
					hasExecute: "execute" in command,
				});
				return;
			}

			commands.set(command.data.name, command);
			logger.debug(`Loaded command: ${command.data.name}`, {
				file: fileName,
			});
		} catch (error) {
			logger.error(`Failed to load command from file: ${filePath}`, error as Error);
		}
	}

	private isValidCommand(command: unknown): command is ChatCommand {
		return (
			typeof command === "object" &&
			command !== null &&
			"data" in command &&
			"execute" in command &&
			typeof (command as { execute: unknown }).execute === "function"
		);
	}
}
