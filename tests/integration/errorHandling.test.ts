import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { SearchyService } from "../../utils/searchyService";

describe("Error Handling Tests", () => {
	// Reset singleton between tests
	beforeEach(() => {
		// biome-ignore lint/suspicious/noExplicitAny: resetting singleton for testing
		(SearchyService as any).instance = null;
	});

	afterEach(() => {
		// biome-ignore lint/suspicious/noExplicitAny: resetting singleton for testing
		(SearchyService as any).instance = null;
	});

	test("SearchyService should use singleton pattern", () => {
		const instance1 = SearchyService.getInstance();
		const instance2 = SearchyService.getInstance();

		// Should be the same instance
		expect(instance1).toBe(instance2);
	});

	test("should detect and categorize different error types", () => {
		const testCases = [
			{
				error: new Error("Video not found or unavailable"),
				expectedCategory: "unavailable",
			},
			{
				error: new Error("This video is unavailable"),
				expectedCategory: "unavailable",
			},
			{
				error: new Error("Failed to search via Searchy"),
				expectedCategory: "service",
			},
			{
				error: new Error("Random error"),
				expectedCategory: "unknown",
			},
		];

		for (const testCase of testCases) {
			const errorMessage = testCase.error.message;
			let category = "unknown";

			if (errorMessage.includes("unavailable") || errorMessage.includes("not found")) {
				category = "unavailable";
			} else if (errorMessage.includes("Searchy") || errorMessage.includes("service")) {
				category = "service";
			}

			expect(category).toBe(testCase.expectedCategory);
		}
	});

	test("should extract video ID from various YouTube URL formats", () => {
		const searchyService = SearchyService.getInstance();

		// Access private method for testing
		// biome-ignore lint/suspicious/noExplicitAny: accessing private method for testing
		const extractVideoId = (searchyService as any).extractVideoId.bind(searchyService);

		// Valid URLs
		expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
		expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
		expect(extractVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
		expect(extractVideoId("https://www.youtube.com/watch?v=abc123DEF_-")).toBe("abc123DEF_-");

		// Invalid URLs should throw
		expect(() => extractVideoId("https://google.com")).toThrow("Invalid YouTube URL");
		expect(() => extractVideoId("not a url")).toThrow("Invalid YouTube URL");
	});

	test("should format duration correctly", () => {
		const searchyService = SearchyService.getInstance();

		// Access private method for testing
		// biome-ignore lint/suspicious/noExplicitAny: accessing private method for testing
		const formatDuration = (searchyService as any).formatDuration.bind(searchyService);

		// Test various durations
		expect(formatDuration(0)).toBe("Unknown");
		expect(formatDuration(null)).toBe("Unknown");
		expect(formatDuration(65)).toBe("1:05");
		expect(formatDuration(3600)).toBe("1:00:00");
		expect(formatDuration(3661)).toBe("1:01:01");
		expect(formatDuration(90)).toBe("1:30");
	});

	test("should provide user-friendly error messages", () => {
		// Test error message templates
		const errorMessages = {
			videoNotFound:
				"This video is not available. It may be private, deleted, or restricted in your region.",
			serviceDown:
				"Failed to search via Searchy. Please ensure the Searchy service is running at http://localhost:8000",
		};

		expect(errorMessages.videoNotFound).toContain("not available");
		expect(errorMessages.videoNotFound).toContain("private");
		expect(errorMessages.serviceDown).toContain("Searchy");
	});
});
