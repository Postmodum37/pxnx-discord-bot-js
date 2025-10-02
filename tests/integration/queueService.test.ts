import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { QueueItem } from "../../utils/queueService";
import { queueService } from "../../utils/queueService";

describe("QueueService Integration Tests", () => {
	const testGuildId = "test-guild-123";
	const testGuildId2 = "test-guild-456";

	beforeEach(() => {
		// Clear any existing queues before each test
		queueService.clearQueue(testGuildId);
		queueService.clearQueue(testGuildId2);
	});

	afterEach(() => {
		// Clean up after each test
		queueService.clearQueue(testGuildId);
		queueService.clearQueue(testGuildId2);
	});

	test("should add items to queue", () => {
		const item: QueueItem = {
			url: "https://www.youtube.com/watch?v=test1",
			title: "Test Song 1",
			requestedBy: "TestUser#1234",
			addedAt: new Date(),
		};

		queueService.addToQueue(testGuildId, item);
		const queue = queueService.getQueue(testGuildId);

		expect(queue.length).toBe(1);
		expect(queue[0]).toMatchObject({
			url: item.url,
			title: item.title,
			requestedBy: item.requestedBy,
		});
	});

	test("should maintain separate queues per guild", () => {
		const item1: QueueItem = {
			url: "https://www.youtube.com/watch?v=test1",
			title: "Test Song 1",
			requestedBy: "TestUser#1234",
			addedAt: new Date(),
		};

		const item2: QueueItem = {
			url: "https://www.youtube.com/watch?v=test2",
			title: "Test Song 2",
			requestedBy: "TestUser#5678",
			addedAt: new Date(),
		};

		queueService.addToQueue(testGuildId, item1);
		queueService.addToQueue(testGuildId2, item2);

		const queue1 = queueService.getQueue(testGuildId);
		const queue2 = queueService.getQueue(testGuildId2);

		expect(queue1.length).toBe(1);
		expect(queue2.length).toBe(1);
		expect(queue1[0].title).toBe("Test Song 1");
		expect(queue2[0].title).toBe("Test Song 2");
	});

	test("should remove items from queue in FIFO order", () => {
		const item1: QueueItem = {
			url: "https://www.youtube.com/watch?v=test1",
			title: "First Song",
			requestedBy: "TestUser#1234",
			addedAt: new Date(),
		};

		const item2: QueueItem = {
			url: "https://www.youtube.com/watch?v=test2",
			title: "Second Song",
			requestedBy: "TestUser#1234",
			addedAt: new Date(),
		};

		queueService.addToQueue(testGuildId, item1);
		queueService.addToQueue(testGuildId, item2);

		const removed = queueService.removeFromQueue(testGuildId);
		expect(removed?.title).toBe("First Song");

		const queue = queueService.getQueue(testGuildId);
		expect(queue.length).toBe(1);
		expect(queue[0].title).toBe("Second Song");
	});

	test("should return null when removing from empty queue", () => {
		const removed = queueService.removeFromQueue(testGuildId);
		expect(removed).toBeNull();
	});

	test("should clear all items from queue", () => {
		const items: QueueItem[] = [
			{
				url: "https://www.youtube.com/watch?v=test1",
				title: "Song 1",
				requestedBy: "TestUser#1234",
				addedAt: new Date(),
			},
			{
				url: "https://www.youtube.com/watch?v=test2",
				title: "Song 2",
				requestedBy: "TestUser#1234",
				addedAt: new Date(),
			},
			{
				url: "https://www.youtube.com/watch?v=test3",
				title: "Song 3",
				requestedBy: "TestUser#1234",
				addedAt: new Date(),
			},
		];

		for (const item of items) {
			queueService.addToQueue(testGuildId, item);
		}

		expect(queueService.getQueue(testGuildId).length).toBe(3);

		queueService.clearQueue(testGuildId);

		expect(queueService.getQueue(testGuildId).length).toBe(0);
	});

	test("should return empty array for non-existent guild", () => {
		const queue = queueService.getQueue("non-existent-guild");
		expect(queue).toEqual([]);
	});

	test("should get queue statistics", () => {
		const item: QueueItem = {
			url: "https://www.youtube.com/watch?v=test1",
			title: "Test Song",
			requestedBy: "TestUser#1234",
			addedAt: new Date(),
		};

		queueService.addToQueue(testGuildId, item);
		queueService.addToQueue(testGuildId, item);

		const stats = queueService.getStats();

		expect(stats.totalQueues).toBeGreaterThanOrEqual(1);
		expect(stats.totalItems).toBeGreaterThanOrEqual(2);
		expect(stats.oldestQueue).toBeInstanceOf(Date);
	});

	test("should handle multiple items in queue correctly", () => {
		const items: QueueItem[] = Array.from({ length: 10 }, (_, i) => ({
			url: `https://www.youtube.com/watch?v=test${i}`,
			title: `Song ${i}`,
			requestedBy: "TestUser#1234",
			addedAt: new Date(),
		}));

		for (const item of items) {
			queueService.addToQueue(testGuildId, item);
		}

		const queue = queueService.getQueue(testGuildId);
		expect(queue.length).toBe(10);

		// Remove 5 items
		for (let i = 0; i < 5; i++) {
			queueService.removeFromQueue(testGuildId);
		}

		const remainingQueue = queueService.getQueue(testGuildId);
		expect(remainingQueue.length).toBe(5);
		expect(remainingQueue[0].title).toBe("Song 5");
	});
});
