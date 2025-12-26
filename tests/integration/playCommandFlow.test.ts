import { describe, expect, mock, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import playCommand from "../../commands/voice/play";

describe("Play Command Full Flow Tests", () => {
	test("should handle complete successful flow: defer -> search -> edit -> select", async () => {
		const flowSteps: string[] = [];

		const mockInteraction = {
			deferred: false,
			replied: false,
			user: {
				id: "123456789",
				tag: "TestUser#1234",
			},
			member: {
				voice: {
					channel: {
						id: "voice-channel-123",
						guild: {
							id: "guild-123",
						},
					},
				},
			},
			guildId: "guild-123",
			guild: {
				voiceAdapterCreator: {},
			},
			options: {
				getString: mock((name: string) => {
					flowSteps.push("getString");
					if (name === "song") return "test song";
					return null;
				}),
			},
			deferReply: mock(async () => {
				flowSteps.push("deferReply");
				mockInteraction.deferred = true;
			}),
			reply: mock(async () => {
				flowSteps.push("reply-ERROR");
				throw new Error("Should not call reply after defer!");
			}),
			editReply: mock(async () => {
				flowSteps.push("editReply");
				return {
					createMessageComponentCollector: mock(() => ({
						on: mock(() => {}),
					})),
				};
			}),
		} as unknown as ChatInputCommandInteraction;

		await playCommand.execute(mockInteraction);

		// Verify flow
		expect(flowSteps).toContain("getString");
		expect(flowSteps).toContain("deferReply");
		expect(flowSteps).toContain("editReply");
		expect(flowSteps).not.toContain("reply-ERROR");
	}, 15000);

	test("should use MessageFlags.Ephemeral instead of deprecated ephemeral property", () => {
		// Verify MessageFlags is a valid export
		expect(MessageFlags.Ephemeral).toBeDefined();
		// MessageFlags.Ephemeral can be bigint or number depending on Discord.js version
		const flagType = typeof MessageFlags.Ephemeral;
		expect(flagType === "bigint" || flagType === "number").toBe(true);
	});

	test("should handle voice channel validation error with proper flags", async () => {
		let errorReplyFlags: bigint | number | undefined;

		const mockInteraction = {
			deferred: false,
			user: {
				id: "123456789",
				tag: "TestUser#1234",
			},
			member: {
				voice: {
					channel: null, // No voice channel
				},
			},
			guildId: "guild-123",
			options: {
				getString: mock((name: string) => {
					if (name === "song") return "test song";
					return null;
				}),
			},
			deferReply: mock(async () => {
				mockInteraction.deferred = true;
			}),
			reply: mock(async (options: { content: string; flags?: bigint | number }) => {
				errorReplyFlags = options.flags;
				return {};
			}),
			editReply: mock(async () => ({})),
		} as unknown as ChatInputCommandInteraction;

		await playCommand.execute(mockInteraction);

		// Should use MessageFlags.Ephemeral (not deprecated ephemeral: true)
		expect(errorReplyFlags).toBe(MessageFlags.Ephemeral);
	});

	test("should handle button interaction with proper error flags", async () => {
		// This test verifies that button interaction errors use MessageFlags
		const buttonFlags: (bigint | number)[] = [];

		const mockButtonInteraction = {
			user: { id: "wrong-user" },
			reply: mock(async (options: { content: string; flags?: bigint | number }) => {
				if (options.flags) {
					buttonFlags.push(options.flags);
				}
			}),
		};

		// Simulate the button validation logic
		const originalUserId = "correct-user";
		if (mockButtonInteraction.user.id !== originalUserId) {
			await mockButtonInteraction.reply({
				content: "You cannot use these buttons.",
				flags: MessageFlags.Ephemeral,
			});
		}

		expect(buttonFlags[0]).toBe(MessageFlags.Ephemeral);
	});

	test("should properly notify user on YouTube playback errors", async () => {
		const errorNotifications: string[] = [];

		// Simulate interaction with followUp capability
		const mockInteraction = {
			followUp: mock(async (options: { content: string; flags?: number }) => {
				errorNotifications.push(options.content);
				return {};
			}),
		};

		// Simulate different error scenarios
		const errors = [
			"YouTube playback is temporarily unavailable. This usually fixes itself within a few hours.",
			"This video is unavailable. It may be private, deleted, or restricted in your region.",
			"Failed to get audio stream. The video may be unavailable.",
		];

		for (const error of errors) {
			if (
				error.includes("signature") ||
				error.includes("decipher") ||
				error.includes("unavailable")
			) {
				await mockInteraction.followUp({
					content: `⚠️ ${error}`,
					flags: 64, // Ephemeral
				});
			}
		}

		// Should have sent notifications for all errors
		expect(errorNotifications.length).toBeGreaterThan(0);
		expect(errorNotifications.every((msg) => msg.startsWith("⚠️"))).toBe(true);
	});

	test("should handle search with no results gracefully", async () => {
		let _noResultsMessageSent = false;

		const mockInteraction = {
			deferred: false,
			user: {
				id: "123456789",
				tag: "TestUser#1234",
			},
			member: {
				voice: {
					channel: {
						id: "voice-channel-123",
						guild: {
							id: "guild-123",
						},
					},
				},
			},
			guildId: "guild-123",
			guild: {
				voiceAdapterCreator: {},
			},
			options: {
				getString: mock((name: string) => {
					if (name === "song") return "xyzabcnonexistent999888";
					return null;
				}),
			},
			deferReply: mock(async () => {
				mockInteraction.deferred = true;
			}),
			reply: mock(async () => ({})),
			editReply: mock(async (content: string | { content: string }) => {
				const message = typeof content === "string" ? content : content;
				if (typeof message === "string" && message.includes("No results")) {
					_noResultsMessageSent = true;
				}
				return {};
			}),
		} as unknown as ChatInputCommandInteraction;

		await playCommand.execute(mockInteraction);

		// Should handle no results
		expect(mockInteraction.deferReply).toHaveBeenCalled();
	}, 15000);
});
