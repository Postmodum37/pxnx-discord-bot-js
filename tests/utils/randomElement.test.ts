import { describe, expect, it } from "bun:test";
import getRandomElement from "../../utils/randomElement";

describe("getRandomElement", () => {
	it("should return an element from the array", () => {
		const arr = ["a", "b", "c"];
		const result = getRandomElement(arr);
		expect(arr).toContain(result);
	});

	it("should return the only element for single-element array", () => {
		const arr = ["only"];
		expect(getRandomElement(arr)).toBe("only");
	});

	it("should work with number arrays", () => {
		const arr = [1, 2, 3, 4, 5];
		const result = getRandomElement(arr);
		expect(arr).toContain(result);
	});

	it("should throw error for empty array", () => {
		expect(() => getRandomElement([])).toThrow("Input must be a non-empty array");
	});

	it("should throw error for non-array input", () => {
		expect(() => getRandomElement(null as unknown as string[])).toThrow(
			"Input must be a non-empty array",
		);
	});
});
