import type { Client, Collection } from "discord.js";
import type { ChatCommand } from "../types/chatCommand";

export interface ExtendedClient extends Client<boolean> {
	commands: Collection<string, ChatCommand>;
}
