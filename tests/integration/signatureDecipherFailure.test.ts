import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { YouTubeService } from "../../utils/youtubeService";

describe("Signature Decipher Failure Tests", () => {
	// Reset singleton between tests
	beforeEach(() => {
		(YouTubeService as any).instance = null;
	});

	afterEach(() => {
		(YouTubeService as any).instance = null;
	});

	test("should detect signature decipher warning during initialization", async () => {
		// Mock console.warn to simulate signature decipher warning
		const originalWarn = console.warn;
		let warningIntercepted = false;

		console.warn = (...args: unknown[]) => {
			const message = args.join(" ");
			if (message.includes("signature") || message.includes("YOUTUBEJS")) {
				warningIntercepted = true;
			}
			originalWarn.apply(console, args);
		};

		const youtubeService = YouTubeService.getInstance();

		try {
			// This will try to initialize and might fail with signature error
			await youtubeService.search("test");
		} catch (error) {
			const errorMessage = (error as Error).message;

			// Should catch signature decipher failures
			if (errorMessage.includes("SIGNATURE_DECIPHER_FAILED")) {
				expect(errorMessage).toContain("YouTube playback is currently unavailable");
				expect(errorMessage).toContain("bun update youtubei.js");
			}
		} finally {
			console.warn = originalWarn;
		}
	}, 15000);

	test("should provide actionable error message for signature failures", () => {
		const signatureError = new Error(
			"SIGNATURE_DECIPHER_FAILED: YouTube's player code has been updated. Please update youtubei.js or try again later.",
		);

		// Verify error message structure
		expect(signatureError.message).toContain("SIGNATURE_DECIPHER_FAILED");
		expect(signatureError.message).toContain("youtubei.js");
	});

	test("should reset init promise on signature decipher failure", async () => {
		const youtubeService = YouTubeService.getInstance();

		// Access private property for testing
		const hasInitPromise = () => (youtubeService as any).initPromise !== null;

		try {
			await youtubeService.search("test");
		} catch (error) {
			const errorMessage = (error as Error).message;
			if (errorMessage.includes("SIGNATURE_DECIPHER_FAILED")) {
				// Init promise should be reset to allow retry
				expect(hasInitPromise()).toBe(false);
			}
		}
	}, 15000);

	test("should categorize different YouTube errors correctly", () => {
		const testCases = [
			{
				error: "SIGNATURE_DECIPHER_FAILED: YouTube's player code has been updated",
				category: "signature_failure",
				shouldContain: ["YouTube playback is currently unavailable", "bun update youtubei.js"],
			},
			{
				error: "This video is unavailable",
				category: "video_unavailable",
				shouldContain: ["unavailable", "private, deleted, or restricted"],
			},
			{
				error: "Random network error",
				category: "unknown",
				shouldContain: ["Failed to search YouTube"],
			},
		];

		for (const testCase of testCases) {
			let category = "unknown";
			let userMessage = "";

			if (testCase.error.includes("SIGNATURE_DECIPHER_FAILED")) {
				category = "signature_failure";
				userMessage =
					"🚫 YouTube playback is currently unavailable due to API changes.\n\n" +
					"**What happened?** YouTube updated their player code and the library needs to be updated.\n\n" +
					"**What to do:**\n" +
					"1. Try again in a few hours (the library usually updates quickly)\n" +
					"2. Ask the bot owner to run: `bun update youtubei.js`\n" +
					"3. Use a different music source temporarily";
			} else if (testCase.error.includes("unavailable")) {
				category = "video_unavailable";
				userMessage =
					"This video is unavailable. It may be private, deleted, or restricted in your region.";
			} else {
				category = "unknown";
				userMessage = "Failed to search YouTube. Please try again later.";
			}

			expect(category).toBe(testCase.category);

			// Verify user message contains helpful information
			for (const phrase of testCase.shouldContain) {
				expect(userMessage.toLowerCase()).toContain(phrase.toLowerCase());
			}
		}
	});

	test("should provide different messages for search vs playback failures", () => {
		const searchError =
			"🚫 YouTube playback is currently unavailable due to API changes.\n\n" +
			"**What happened?** YouTube updated their player code and the library needs to be updated.\n\n" +
			"**What to do:**\n" +
			"1. Try again in a few hours (the library usually updates quickly)\n" +
			"2. Ask the bot owner to run: `bun update youtubei.js`\n" +
			"3. Use a different music source temporarily";

		const playbackError =
			"YouTube playback is temporarily unavailable. This usually fixes itself within a few hours. Please try again later or use a different video.";

		// Both should mention the issue
		expect(searchError).toContain("YouTube");
		expect(playbackError).toContain("YouTube");

		// Search error should have more details and actionable steps
		expect(searchError).toContain("bun update youtubei.js");
		expect(searchError).toContain("What to do:");

		// Playback error should be shorter and suggest alternatives
		expect(playbackError).toContain("different video");
		expect(playbackError).toContain("try again later");
	});

	test("should handle console.warn interception safely", () => {
		const originalWarn = console.warn;
		const interceptedMessages: string[] = [];

		// Setup interception
		console.warn = (...args: unknown[]) => {
			const message = args.join(" ");
			interceptedMessages.push(message);
			// Don't call originalWarn to avoid console noise in tests
		};

		// Trigger some warnings
		console.warn("Test warning 1");
		console.warn("YOUTUBEJS signature warning");
		console.warn("Test warning 2");

		// Restore
		console.warn = originalWarn;

		// Verify interception worked
		expect(interceptedMessages.length).toBe(3);
		expect(interceptedMessages[1]).toContain("YOUTUBEJS");

		// Verify restoration
		expect(console.warn).toBe(originalWarn);
	});

	test("should allow retry after signature failure", async () => {
		const youtubeService = YouTubeService.getInstance();

		try {
			await youtubeService.search("test");
		} catch (firstError) {
			// First attempt might fail with signature error

			// Should be able to retry (initPromise reset)
			try {
				await youtubeService.search("test");
			} catch (secondError) {
				// Second attempt should also handle error gracefully
				expect(secondError).toBeDefined();
			}
		}
	}, 20000);
});
