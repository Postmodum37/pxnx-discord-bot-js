import { type Client, Events } from "discord.js";
import { logger } from "../utils/logger";

const event = {
	name: Events.ClientReady,
	once: true,
	execute(client: Client) {
		logger.info("Bot is ready and logged in", {
			username: client.user?.tag,
			id: client.user?.id,
			guilds: client.guilds.cache.size,
		});
	},
};

export default event;
