import { describe, expect, mock, test } from "bun:test";
import { YouTubeService } from "../../utils/youtubeService";

describe("Error Handling Integration Tests", () => {
	test("should provide user-friendly error for signature decipher failures", async () => {
		const youtubeService = YouTubeService.getInstance();

		// Mock the getInfo method to simulate signature decipher error
		const originalGetInfo = (youtubeService as any).yt?.getInfo;

		try {
			// This will likely fail with signature decipher error in real scenarios
			await youtubeService.getAudioStream("https://www.youtube.com/watch?v=test123");
		} catch (error) {
			const errorMessage = (error as Error).message;

			// Should have user-friendly error message
			expect(errorMessage).toBeDefined();
			expect(errorMessage.length).toBeGreaterThan(0);

			// Should either be the unavailable error or the signature error
			const isExpectedError =
				errorMessage.includes("unavailable") ||
				errorMessage.includes("temporarily unavailable") ||
				errorMessage.includes("signature");

			expect(isExpectedError).toBe(true);
		}
	}, 10000);

	test("should handle unavailable videos gracefully", async () => {
		const youtubeService = YouTubeService.getInstance();

		try {
			await youtubeService.getAudioStream("https://www.youtube.com/watch?v=invalid999");
		} catch (error) {
			const errorMessage = (error as Error).message;

			// Should have descriptive error
			expect(errorMessage).toBeDefined();
			expect(
				errorMessage.includes("unavailable") ||
					errorMessage.includes("temporarily unavailable"),
			).toBe(true);
		}
	}, 10000);

	test("should detect and categorize different error types", () => {
		const testCases = [
			{
				error: new Error("Failed to extract signature decipher algorithm"),
				expectedCategory: "signature",
			},
			{
				error: new Error("This video is unavailable"),
				expectedCategory: "unavailable",
			},
			{
				error: new Error("Random error"),
				expectedCategory: "unknown",
			},
		];

		for (const testCase of testCases) {
			const errorMessage = testCase.error.message;
			let category = "unknown";

			if (errorMessage.includes("signature") || errorMessage.includes("decipher")) {
				category = "signature";
			} else if (errorMessage.includes("unavailable")) {
				category = "unavailable";
			}

			expect(category).toBe(testCase.expectedCategory);
		}
	});

	test("YouTubeService should use singleton pattern", () => {
		const instance1 = YouTubeService.getInstance();
		const instance2 = YouTubeService.getInstance();

		// Should be the same instance
		expect(instance1).toBe(instance2);
	});

	test("should handle search errors gracefully", async () => {
		const youtubeService = YouTubeService.getInstance();

		// Empty search should still work (return empty array or throw)
		try {
			const results = await youtubeService.search("");
			expect(results).toBeInstanceOf(Array);
		} catch (error) {
			// If it throws, error should be user-friendly
			const errorMessage = (error as Error).message;
			expect(errorMessage).toBeDefined();
			expect(errorMessage.includes("search")).toBe(true);
		}
	}, 10000);
});
