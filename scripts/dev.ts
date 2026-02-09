#!/usr/bin/env bun
/**
 * Development Environment Runner
 *
 * Starts both Searchy and Discord bot services with proper lifecycle management.
 * - Starts Searchy first, waits for health check
 * - Then starts bot with watch mode
 * - Handles Ctrl+C for clean shutdown of both processes
 *
 * Usage: bun run dev (from pxnx-discord-bot-js directory)
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Subprocess } from "bun";

// ANSI colors for log prefixes
const COLORS = {
	searchy: "\x1b[35m", // Magenta
	bot: "\x1b[36m", // Cyan
	system: "\x1b[33m", // Yellow
	reset: "\x1b[0m",
};

// Configuration - paths relative to this project
const PROJECT_ROOT = resolve(import.meta.dir, "..");
const SEARCHY_DIR = resolve(PROJECT_ROOT, "../searchy");
const SEARCHY_URL = process.env["SEARCHY_URL"] || "http://localhost:8000";
const HEALTH_CHECK_TIMEOUT = 30000;
const HEALTH_CHECK_INTERVAL = 500;
const SHUTDOWN_TIMEOUT = 5000; // Time to wait before SIGKILL

// Process handles
let searchyProcess: Subprocess | null = null;
let botProcess: Subprocess | null = null;
let isShuttingDown = false;

function log(prefix: string, color: string, message: string): void {
	console.log(`${color}[${prefix}]${COLORS.reset} ${message}`);
}

function logSystem(message: string): void {
	log("DEV", COLORS.system, message);
}

/**
 * Pipe subprocess output with colored prefix
 */
async function pipeOutput(
	stream: ReadableStream<Uint8Array>,
	prefix: string,
	color: string,
): Promise<void> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const text = decoder.decode(value, { stream: true });
			const lines = text.split("\n");

			for (const line of lines) {
				if (line.trim()) {
					log(prefix, color, line);
				}
			}
		}
	} catch {
		// Stream closed, ignore
	}
}

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
 * Kill a process with graceful shutdown and SIGKILL fallback
 */
async function killProcess(proc: Subprocess, name: string): Promise<void> {
	if (proc.exitCode !== null) return;

	logSystem(`Stopping ${name}...`);
	proc.kill("SIGTERM");

	// Race between graceful exit and timeout
	const exited = await Promise.race([
		proc.exited.then(() => true),
		Bun.sleep(SHUTDOWN_TIMEOUT).then(() => false),
	]);

	if (!exited && proc.exitCode === null) {
		logSystem(`${name} didn't stop gracefully, forcing...`);
		proc.kill("SIGKILL");
		await proc.exited;
	}
}

/**
 * Start Searchy service
 */
async function startSearchy(): Promise<void> {
	// Check if already running
	if (await isSearchyHealthy()) {
		logSystem(`Searchy is already running at ${SEARCHY_URL}`);
		return;
	}

	// Verify prerequisites
	if (!isUvInstalled()) {
		throw new Error(
			"'uv' is not installed. Install from: https://docs.astral.sh/uv/getting-started/installation/",
		);
	}

	if (!existsSync(SEARCHY_DIR)) {
		throw new Error(`Searchy directory not found at: ${SEARCHY_DIR}`);
	}

	logSystem("Starting Searchy service...");

	searchyProcess = Bun.spawn(
		["uv", "run", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1"],
		{
			cwd: SEARCHY_DIR,
			stdout: "pipe",
			stderr: "pipe",
			env: {
				...process.env,
				SEARCHY_LOG_LEVEL: "INFO",
			},
		},
	);

	// Pipe output asynchronously (with error handling)
	if (searchyProcess.stdout && typeof searchyProcess.stdout !== "number") {
		pipeOutput(searchyProcess.stdout, "SEARCHY", COLORS.searchy).catch(() => {});
	}
	if (searchyProcess.stderr && typeof searchyProcess.stderr !== "number") {
		pipeOutput(searchyProcess.stderr, "SEARCHY", COLORS.searchy).catch(() => {});
	}

	// Wait for health check
	const startTime = Date.now();
	while (Date.now() - startTime < HEALTH_CHECK_TIMEOUT) {
		if (await isSearchyHealthy()) {
			logSystem(`Searchy is healthy at ${SEARCHY_URL}`);
			return;
		}

		// Check if process died
		if (searchyProcess.exitCode !== null) {
			throw new Error("Searchy process exited unexpectedly");
		}

		await Bun.sleep(HEALTH_CHECK_INTERVAL);
	}

	throw new Error(`Searchy failed to become healthy within ${HEALTH_CHECK_TIMEOUT}ms`);
}

/**
 * Start Discord bot
 */
async function startBot(): Promise<void> {
	logSystem("Starting Discord bot...");

	botProcess = Bun.spawn(["bun", "run", "--watch", "index.ts"], {
		cwd: PROJECT_ROOT,
		stdout: "pipe",
		stderr: "pipe",
		env: process.env,
	});

	// Pipe output asynchronously (with error handling)
	if (botProcess.stdout && typeof botProcess.stdout !== "number") {
		pipeOutput(botProcess.stdout, "BOT", COLORS.bot).catch(() => {});
	}
	if (botProcess.stderr && typeof botProcess.stderr !== "number") {
		pipeOutput(botProcess.stderr, "BOT", COLORS.bot).catch(() => {});
	}

	logSystem("Bot started with watch mode");
}

/**
 * Graceful shutdown of all processes
 */
async function shutdown(): Promise<void> {
	if (isShuttingDown) return;
	isShuttingDown = true;

	logSystem("Shutting down...");

	const shutdownPromises: Promise<void>[] = [];

	if (botProcess && botProcess.exitCode === null) {
		shutdownPromises.push(killProcess(botProcess, "bot"));
	}

	if (searchyProcess && searchyProcess.exitCode === null) {
		shutdownPromises.push(killProcess(searchyProcess, "Searchy"));
	}

	await Promise.all(shutdownPromises);
	logSystem("All services stopped");
	process.exit(0);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
	console.log(`
${COLORS.system}╔═══════════════════════════════════════╗
║     Discord Bot Development Mode      ║
║  Press Ctrl+C to stop all services    ║
╚═══════════════════════════════════════╝${COLORS.reset}
`);

	// Register signal handlers
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);

	try {
		// Start Searchy first, wait for health
		await startSearchy();

		// Then start bot
		await startBot();

		// Keep running until signal
		logSystem("Development environment ready!");

		// Wait for processes to exit (only if we started them)
		// Use never-resolving promise for null/external processes
		const neverResolve = new Promise<string>(() => {});

		const searchyExited = searchyProcess
			? searchyProcess.exited.then(() => "Searchy")
			: neverResolve;

		const botExited = botProcess ? botProcess.exited.then(() => "Bot") : neverResolve;

		const exitedService = await Promise.race([searchyExited, botExited]);

		// If we get here, a process died unexpectedly
		if (!isShuttingDown) {
			logSystem(`${exitedService} service stopped unexpectedly`);
			await shutdown();
		}
	} catch (error) {
		console.error(`${COLORS.system}[DEV]${COLORS.reset} Error:`, (error as Error).message);
		await shutdown();
		process.exit(1);
	}
}

main();
