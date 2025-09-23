import type { GuildMember, VoiceBasedChannel } from "discord.js";

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

export function validateVoiceChannel(member: GuildMember | null): VoiceBasedChannel {
	if (!member) {
		throw new ValidationError("Member information is not available");
	}

	const voiceChannel = member.voice.channel;
	if (!voiceChannel) {
		throw new ValidationError("You need to be in a voice channel to use this command");
	}

	return voiceChannel;
}

export function validateGuildId(guildId: string | null): string {
	if (!guildId) {
		throw new ValidationError("This command can only be used in a server");
	}
	return guildId;
}

export function validateString(value: string | null, fieldName: string): string {
	if (!value || value.trim() === "") {
		throw new ValidationError(`${fieldName} is required and cannot be empty`);
	}
	return value.trim();
}
