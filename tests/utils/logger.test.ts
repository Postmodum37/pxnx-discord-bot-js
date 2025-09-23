import { describe, expect, it, spyOn } from "bun:test";
import { LogLevel, logger } from "../../utils/logger";

describe("Logger", () => {
	it("should log info messages", () => {
		const consoleSpy = spyOn(console, "log");
		logger.info("Test message", { key: "value" });
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("should log error messages", () => {
		const consoleSpy = spyOn(console, "error");
		const testError = new Error("Test error");
		logger.error("Error occurred", testError, { context: "test" });
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("should respect log level filtering", () => {
		const consoleSpy = spyOn(console, "log");
		logger.setLevel(LogLevel.ERROR);
		logger.info("This should not log");
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
