/**
 * Searchy Service Lifecycle Manager for Integration Tests
 *
 * This module automatically starts the Searchy service before integration tests
 * and cleans it up after tests complete. It's loaded via Bun's --preload flag.
 *
 * Usage: bun test --preload ./tests/setup/searchyLifecycle.ts tests/integration/
 */

import { afterAll, beforeAll } from "bun:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Subprocess } from "bun";

// Configuration - paths relative to project root
const PROJECT_ROOT = resolve(import.meta.dir, "../..");
const SEARCHY_DIR = resolve(PROJECT_ROOT, "../searchy");
const SEARCHY_URL = "http://localhost:8000";
const HEALTH_CHECK_TIMEOUT = 30000; // 30 seconds
const HEALTH_CHECK_INTERVAL = 500; // 500ms

// Global state
let searchyProcess: Subprocess | null = null;
let wasAlreadyRunning = false;

/**
 * Check if Searchy is healthy
 */
async function isSearchyHealthy(): Promise<boolean> {
	try {
		const response = await fetch(`${SEARCHY_URL}/health`, {
			signal: AbortSignal.timeout(2000),
		});
		const data = (await response.json()) as { status: string };
		return response.ok && data.status === "healthy";
	} catch {
		return false;
	}
}

/**
 * Check if 'uv' is installed
 */
function isUvInstalled(): boolean {
	try {
		const result = Bun.spawnSync(["uv", "--version"]);
		return result.exitCode === 0;
	} catch {
		return false;
	}
}

/**
 * Start Searchy and wait for it to be healthy
 */
async function startSearchy(): Promise<void> {
	// Check if already running externally
	if (await isSearchyHealthy()) {
		console.log("[Test Setup] Searchy is already running at", SEARCHY_URL);
		wasAlreadyRunning = true;
		return;
	}

	// Verify uv is installed
	if (!isUvInstalled()) {
		throw new Error(
			"'uv' is not installed or not in PATH.\n" +
				"Install it from: https://docs.astral.sh/uv/getting-started/installation/",
		);
	}

	// Verify Searchy directory exists
	if (!existsSync(SEARCHY_DIR)) {
		throw new Error(
			`Searchy directory not found at: ${SEARCHY_DIR}\n` +
				"Please ensure the searchy project is cloned alongside this project.",
		);
	}

	console.log("[Test Setup] Starting Searchy service...");

	// Spawn Searchy process
	searchyProcess = Bun.spawn(["uv", "run", "uvicorn", "app.main:app", "--host", "127.0.0.1"], {
		cwd: SEARCHY_DIR,
		stdout: "ignore",
		stderr: "pipe",
		env: {
			...process.env,
			SEARCHY_LOG_LEVEL: "WARNING",
		},
	});

	// Wait for health check
	const startTime = Date.now();
	while (Date.now() - startTime < HEALTH_CHECK_TIMEOUT) {
		if (await isSearchyHealthy()) {
			console.log(`[Test Setup] Searchy is healthy at ${SEARCHY_URL}`);
			return;
		}

		// Check if process died
		if (searchyProcess.exitCode !== null) {
			const stderrStream = searchyProcess.stderr;
			const stderr =
				stderrStream && typeof stderrStream !== "number"
					? await new Response(stderrStream).text()
					: "";
			if (stderr.includes("Address already in use") || stderr.includes("address already in use")) {
				throw new Error(
					`Port 8000 is already in use by another process.\n` +
						"Please stop the conflicting service or check if Searchy is already running.\n" +
						`Stderr: ${stderr}`,
				);
			}
			throw new Error(`Searchy process exited unexpectedly.\nStderr: ${stderr}`);
		}

		await Bun.sleep(HEALTH_CHECK_INTERVAL);
	}

	// Health check timeout - clean up and fail
	if (searchyProcess && searchyProcess.exitCode === null) {
		searchyProcess.kill();
		await searchyProcess.exited;
	}
	throw new Error(
		`Searchy failed to start within ${HEALTH_CHECK_TIMEOUT}ms.\n` +
			"Check that 'uv' is installed and Searchy dependencies are available.",
	);
}

/**
 * Stop Searchy process if we started it
 */
async function stopSearchy(): Promise<void> {
	// Don't stop if it was already running before tests
	if (wasAlreadyRunning) {
		console.log("[Test Setup] Searchy was externally started, not stopping");
		return;
	}

	if (searchyProcess && searchyProcess.exitCode === null) {
		console.log("[Test Setup] Stopping Searchy service...");
		searchyProcess.kill();
		await searchyProcess.exited;
		searchyProcess = null;
	}
}

// Use Bun's test lifecycle hooks for reliable cleanup
beforeAll(async () => {
	await startSearchy();
}, 35000); // Timeout slightly longer than health check

afterAll(async () => {
	await stopSearchy();
}, 10000);
