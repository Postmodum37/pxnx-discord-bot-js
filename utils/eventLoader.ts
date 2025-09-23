import fs from "node:fs";
import path from "node:path";
import type { Client } from "discord.js";
import { logger } from "./logger";

interface EventModule {
	name: string;
	once?: boolean;
	execute: (...args: unknown[]) => void | Promise<void>;
}

export class EventLoader {
	private readonly eventsPath: string;

	constructor(eventsPath: string) {
		this.eventsPath = eventsPath;
	}

	async loadEvents(client: Client): Promise<void> {
		try {
			const eventFiles = await this.getEventFiles();
			let loadedCount = 0;

			for (const file of eventFiles) {
				await this.loadEvent(client, file);
				loadedCount++;
			}

			logger.info(`Successfully loaded ${loadedCount} events`);
		} catch (error) {
			logger.error("Failed to load events", error as Error);
			throw error;
		}
	}

	private async getEventFiles(): Promise<string[]> {
		const files = await fs.promises.readdir(this.eventsPath);
		return files.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
	}

	private async loadEvent(client: Client, fileName: string): Promise<void> {
		const filePath = path.join(this.eventsPath, fileName);

		try {
			// Use dynamic import instead of require()
			const module = await import(filePath);
			const event = module.default as EventModule;

			if (!this.isValidEvent(event)) {
				logger.warn(`Invalid event structure in file: ${filePath}`, {
					hasName: "name" in event,
					hasExecute: "execute" in event,
				});
				return;
			}

			if (event.once) {
				client.once(event.name, (...args) => event.execute(...args));
			} else {
				client.on(event.name, (...args) => event.execute(...args));
			}

			logger.debug(`Loaded event: ${event.name}`, {
				file: fileName,
				once: event.once ?? false,
			});
		} catch (error) {
			logger.error(`Failed to load event from file: ${filePath}`, error as Error);
		}
	}

	private isValidEvent(event: unknown): event is EventModule {
		return (
			typeof event === "object" &&
			event !== null &&
			"name" in event &&
			"execute" in event &&
			typeof (event as { name: unknown }).name === "string" &&
			typeof (event as { execute: unknown }).execute === "function"
		);
	}
}
