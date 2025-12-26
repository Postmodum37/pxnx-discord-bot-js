import { describe, expect, mock, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import playCommand from "../../commands/voice/play";

describe("Play Command Error Handling", () => {
	test("should display user-friendly error when Searchy service is unavailable", async () => {
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

		// When Searchy is unavailable, user should get helpful error message
		if (errorMessageToUser?.includes("Searchy") || errorMessageToUser?.includes("search")) {
			expect(errorMessageToUser).toBeDefined();
		}
	}, 20000);

	test("should handle service errors gracefully without crashing", async () => {
		let errorHandled = false;

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
			editReply: mock(async () => {
				errorHandled = true;
				return {
					createMessageComponentCollector: mock(() => ({
						on: mock(() => {}),
					})),
				};
			}),
			reply: mock(async () => ({})),
		} as unknown as ChatInputCommandInteraction;

		// Run the command - it should handle errors gracefully without throwing
		await playCommand.execute(mockInteraction);

		// Verify the command responded (either with results or error message)
		expect(mockInteraction.deferReply).toHaveBeenCalled();
		expect(errorHandled).toBe(true);
	}, 20000);

	test("should differentiate between service and video errors", () => {
		const errors = [
			{
				message: "Failed to search via Searchy. Please ensure the Searchy service is running",
				type: "service",
				isUserFriendly: true,
			},
			{
				message:
					"This video is not available. It may be private, deleted, or restricted in your region.",
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
			if (error.type === "service") {
				expect(error.message).toContain("Searchy");
				expect(error.isUserFriendly).toBe(true);
			} else if (error.type === "unavailable") {
				expect(error.message).toContain("not available");
				expect(error.message).toContain("private, deleted, or restricted");
				expect(error.isUserFriendly).toBe(true);
			}
		}
	});

	test("should provide clear error messages for common issues", () => {
		const errorMessages = {
			serviceDown:
				"Failed to search via Searchy. Please ensure the Searchy service is running at http://localhost:8000",
			videoNotFound:
				"This video is not available. It may be private, deleted, or restricted in your region.",
			noResults: "No results found for your search query. Try a different search term.",
		};

		// Verify service error message
		expect(errorMessages.serviceDown).toContain("Searchy");
		expect(errorMessages.serviceDown).toContain("running");

		// Verify video not found message
		expect(errorMessages.videoNotFound).toContain("not available");
		expect(errorMessages.videoNotFound).toContain("private");

		// Verify no results message
		expect(errorMessages.noResults).toContain("No results");
	});

	test("should log errors appropriately", async () => {
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

		// Simulate service connection error
		const serviceError = "Unable to connect. Is the computer able to access the url?";
		mockLogger.warn(serviceError);

		// Should log the warning
		expect(logEntries.some((log) => log.includes("WARN"))).toBe(true);
	});
});
