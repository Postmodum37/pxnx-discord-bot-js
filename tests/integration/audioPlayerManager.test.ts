import { afterEach, describe, expect, test } from "bun:test";
import { AudioPlayerStatus } from "@discordjs/voice";
import { audioPlayerManager } from "../../utils/audioPlayerManager";

describe("AudioPlayerManager Integration Tests", () => {
	const testGuildId1 = "test-guild-audio-1";
	const testGuildId2 = "test-guild-audio-2";

	afterEach(() => {
		// Clean up after each test
		audioPlayerManager.removePlayer(testGuildId1);
		audioPlayerManager.removePlayer(testGuildId2);
	});

	test("should create a new audio player for a guild", () => {
		const player = audioPlayerManager.getOrCreatePlayer(testGuildId1);

		expect(player).toBeDefined();
		expect(player.state.status).toBe(AudioPlayerStatus.Idle);
	});

	test("should reuse existing audio player for the same guild", () => {
		const player1 = audioPlayerManager.getOrCreatePlayer(testGuildId1);
		const player2 = audioPlayerManager.getOrCreatePlayer(testGuildId1);

		// Should be the exact same instance
		expect(player1).toBe(player2);
	});

	test("should create separate players for different guilds", () => {
		const player1 = audioPlayerManager.getOrCreatePlayer(testGuildId1);
		const player2 = audioPlayerManager.getOrCreatePlayer(testGuildId2);

		// Should be different instances
		expect(player1).not.toBe(player2);
	});

	test("should remove player for a guild", () => {
		const player = audioPlayerManager.getOrCreatePlayer(testGuildId1);
		expect(player).toBeDefined();

		audioPlayerManager.removePlayer(testGuildId1);

		// After removal, getting the player again should create a new instance
		const newPlayer = audioPlayerManager.getOrCreatePlayer(testGuildId1);
		expect(newPlayer).not.toBe(player);
	});

	test("should get player without creating if it exists", () => {
		const createdPlayer = audioPlayerManager.getOrCreatePlayer(testGuildId1);
		const retrievedPlayer = audioPlayerManager.getPlayer(testGuildId1);

		expect(retrievedPlayer).toBe(createdPlayer);
	});

	test("should return undefined when getting non-existent player", () => {
		const player = audioPlayerManager.getPlayer("non-existent-guild");
		expect(player).toBeUndefined();
	});

	test("should provide accurate statistics", () => {
		audioPlayerManager.getOrCreatePlayer(testGuildId1);
		audioPlayerManager.getOrCreatePlayer(testGuildId2);

		const stats = audioPlayerManager.getStats();

		expect(stats.totalPlayers).toBeGreaterThanOrEqual(2);
		expect(stats.idlePlayers).toBeGreaterThanOrEqual(2);
		expect(stats.activePlayers).toBe(0);
	});

	test("should handle multiple operations on same guild", () => {
		// Create player
		const player1 = audioPlayerManager.getOrCreatePlayer(testGuildId1);
		expect(player1).toBeDefined();

		// Get without creating
		const player2 = audioPlayerManager.getPlayer(testGuildId1);
		expect(player2).toBe(player1);

		// Get or create (should return existing)
		const player3 = audioPlayerManager.getOrCreatePlayer(testGuildId1);
		expect(player3).toBe(player1);

		// Remove
		audioPlayerManager.removePlayer(testGuildId1);

		// Get without creating (should be undefined)
		const player4 = audioPlayerManager.getPlayer(testGuildId1);
		expect(player4).toBeUndefined();

		// Create again (should be new instance)
		const player5 = audioPlayerManager.getOrCreatePlayer(testGuildId1);
		expect(player5).not.toBe(player1);
	});

	test("should properly stop player when removing", () => {
		const player = audioPlayerManager.getOrCreatePlayer(testGuildId1);

		// Remove the player (which should stop it)
		audioPlayerManager.removePlayer(testGuildId1);

		// Player should be stopped
		expect(player.state.status).toBe(AudioPlayerStatus.Idle);
	});
});
