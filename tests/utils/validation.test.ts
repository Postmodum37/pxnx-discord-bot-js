import { describe, expect, it } from "bun:test";
import type { GuildMember } from "discord.js";
import {
	ValidationError,
	validateGuildId,
	validateString,
	validateVoiceChannel,
} from "../../utils/validation";

describe("Validation utilities", () => {
	describe("validateString", () => {
		it("should return trimmed string for valid input", () => {
			expect(validateString("  hello world  ", "test")).toBe("hello world");
		});

		it("should throw ValidationError for null input", () => {
			expect(() => validateString(null, "test")).toThrow(ValidationError);
		});

		it("should throw ValidationError for empty string", () => {
			expect(() => validateString("", "test")).toThrow(ValidationError);
		});

		it("should throw ValidationError for whitespace only", () => {
			expect(() => validateString("   ", "test")).toThrow(ValidationError);
		});
	});

	describe("validateGuildId", () => {
		it("should return guildId for valid input", () => {
			expect(validateGuildId("123456789")).toBe("123456789");
		});

		it("should throw ValidationError for null input", () => {
			expect(() => validateGuildId(null)).toThrow(ValidationError);
		});
	});

	describe("validateVoiceChannel", () => {
		it("should return voice channel for valid member", () => {
			const mockChannel = { id: "voice123", name: "General" };
			const mockMember = {
				voice: { channel: mockChannel },
			} as unknown as GuildMember;

			expect(validateVoiceChannel(mockMember)).toBe(mockChannel);
		});

		it("should throw ValidationError for null member", () => {
			expect(() => validateVoiceChannel(null)).toThrow(ValidationError);
		});

		it("should throw ValidationError for member not in voice channel", () => {
			const mockMember = {
				voice: { channel: null },
			} as unknown as GuildMember;

			expect(() => validateVoiceChannel(mockMember)).toThrow(ValidationError);
		});
	});
});
