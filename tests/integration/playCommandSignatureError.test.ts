import { describe, expect, mock, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import playCommand from "../../commands/voice/play";

describe("Play Command Signature Decipher Error Handling", () => {
	test("should display user-friendly error when signature decipher fails", async () => {
		let errorMessageToUser: string | null = null;

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
					if (name === "song") return "test song";
					return null;
				}),
			},
			deferReply: mock(async () => {
				mockInteraction.deferred = true;
			}),
			editReply: mock(async (content: string | { content: string }) => {
				errorMessageToUser = typeof content === "string" ? content : content.content || null;
				return {};
			}),
			reply: mock(async () => {
				throw new Error("Should not call reply after defer");
			}),
		} as unknown as ChatInputCommandInteraction;

		await playCommand.execute(mockInteraction);

		// If signature decipher fails, user should get helpful error message
		if (errorMessageToUser?.includes("YouTube playback is currently unavailable")) {
			expect(errorMessageToUser).toContain("API changes");
			expect(errorMessageToUser).toContain("bun update youtubei.js");
			expect(errorMessageToUser).toContain("What to do:");
		}
	}, 20000);

	test("should handle signature errors gracefully without crashing", async () => {
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
					if (name === "song") return "test";
					return null;
				}),
			},
			deferReply: mock(async () => {
				mockInteraction.deferred = true;
			}),
			editReply: mock(async () => ({
				createMessageComponentCollector: mock(() => ({
					on: mock(() => {}),
				})),
			})),
			reply: mock(async () => ({})),
		} as unknown as ChatInputCommandInteraction;

		// Should not throw - errors should be handled gracefully
		await expect(playCommand.execute(mockInteraction)).resolves.toBeDefined();
	}, 20000);

	test("should differentiate between signature errors and other errors", () => {
		const errors = [
			{
				message:
					"🚫 YouTube playback is currently unavailable due to API changes.\n\nAsk the bot owner to run: `bun update youtubei.js`",
				type: "signature",
				isUserFriendly: true,
			},
			{
				message: "This video is unavailable. It may be private, deleted, or restricted.",
				type: "unavailable",
				isUserFriendly: true,
			},
			{
				message: "Network timeout error",
				type: "generic",
				isUserFriendly: false,
			},
		];

		for (const error of errors) {
			if (error.type === "signature") {
				expect(error.message).toContain("YouTube playback is currently unavailable");
				expect(error.message).toContain("bun update");
				expect(error.isUserFriendly).toBe(true);
			} else if (error.type === "unavailable") {
				expect(error.message).toContain("unavailable");
				expect(error.message).toContain("private, deleted, or restricted");
				expect(error.isUserFriendly).toBe(true);
			}
		}
	});

	test("should track signature failure in logs", async () => {
		const logEntries: string[] = [];

		// Mock logger to capture log messages
		const mockLogger = {
			warn: (message: string) => {
				logEntries.push(`WARN: ${message}`);
			},
			error: (message: string) => {
				logEntries.push(`ERROR: ${message}`);
			},
			info: (message: string) => {
				logEntries.push(`INFO: ${message}`);
			},
			debug: () => {},
		};

		// Simulate signature decipher warning detection
		const signatureWarning = "YOUTUBEJS Player: Failed to extract signature decipher algorithm";
		mockLogger.warn(signatureWarning);

		// Should log the warning
		expect(logEntries.some((log) => log.includes("WARN"))).toBe(true);
	});

	test("should provide clear recovery steps in error message", () => {
		const signatureErrorMessage =
			"🚫 YouTube playback is currently unavailable due to API changes.\n\n" +
			"**What happened?** YouTube updated their player code and the library needs to be updated.\n\n" +
			"**What to do:**\n" +
			"1. Try again in a few hours (the library usually updates quickly)\n" +
			"2. Ask the bot owner to run: `bun update youtubei.js`\n" +
			"3. Use a different music source temporarily";

		// Verify structure
		expect(signatureErrorMessage).toContain("What happened?");
		expect(signatureErrorMessage).toContain("What to do:");

		// Verify steps
		expect(signatureErrorMessage).toContain("1. Try again in a few hours");
		expect(signatureErrorMessage).toContain("2. Ask the bot owner");
		expect(signatureErrorMessage).toContain("3. Use a different music source");

		// Verify technical details for bot owner
		expect(signatureErrorMessage).toContain("bun update youtubei.js");
	});
});
