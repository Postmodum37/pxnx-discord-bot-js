# UTILS - SERVICE LAYER

Core services for Discord bot. All singletons. All use structured logging.

## OVERVIEW

10 files providing: Searchy API client, music queue, audio player management, validation, logging, config, embeds.

## STRUCTURE

```
utils/
├── searchyService.ts    # HTTP client for Searchy API (retry logic)
├── queueService.ts      # Per-guild music queues (TTL cleanup)
├── audioPlayerManager.ts # Discord.js AudioPlayer instances
├── validation.ts        # Input validation with custom errors
├── logger.ts            # Structured logging (debug/info/warn/error)
├── config.ts            # Environment variable loader
├── embedFactory.ts      # Discord embed builders
├── commandLoader.ts     # Dynamic command discovery
├── eventLoader.ts       # Event handler registration
└── randomElement.ts     # Array utility
```

## WHERE TO LOOK

| Task | File | Key Lines |
|------|------|-----------|
| Add retry logic | `searchyService.ts` | 87-108 (`retry()` method) |
| Change queue TTL | `queueService.ts` | 28-29 (constants) |
| Add validation rule | `validation.ts` | Follow `validateString()` pattern |
| Custom embed | `embedFactory.ts` | Add new builder function |
| Add log level | `logger.ts` | Extend `LogLevel` enum |

## SERVICE DEPENDENCIES

```
Commands
  └── QueueService
        ├── SearchyService (getAudioStreamUrl)
        ├── AudioPlayerManager (getOrCreate)
        └── Logger
```

## CONVENTIONS

### Singleton Pattern
```typescript
// Private static instance
private static instance: SearchyService | null = null;

// Factory method
static getInstance(): SearchyService {
  if (!SearchyService.instance) {
    SearchyService.instance = new SearchyService();
  }
  return SearchyService.instance;
}
```

### Cleanup Timer Pattern
```typescript
private startCleanupTimer(): void {
  this.cleanupInterval = setInterval(() => {
    this.cleanupInactiveQueues();
  }, QueueService.CLEANUP_INTERVAL);
}
```
- Interval: 30 minutes
- TTL: 1 hour of inactivity

### Validation Pattern
```typescript
export function validateString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${fieldName} must be a non-empty string`);
  }
  return value.trim();
}
```
- Always throw `ValidationError` (not generic Error)
- Commands catch and show user-friendly message

### Logging Pattern
```typescript
logger.info("Queue item added", {
  guildId,
  title: queueItem.title,
  queueLength: queueData.items.length,
});
```
- Second param: context object (not string concatenation)
- Include: guildId, userId, relevant IDs

## ANTI-PATTERNS

- **Never** import services with `new` (use `getInstance()` or module export)
- **Never** skip `validateString()` for user input
- **Never** use `console.log` (use `logger.*`)
- **Never** forget to update `lastActivity` on queue operations

## KEY INTERFACES

```typescript
// queueService.ts
interface QueueItem {
  url: string;
  title: string;
  requestedBy: string;
  addedAt: Date;
}

// searchyService.ts
interface AudioStreamInfo {
  url: string;
  title: string;
  format: { id, ext, codec, bitrate };
  expiresIn: number;
}
```

## NOTES

- `queueService` exported as module-level instance (not class)
- `SearchyService.search()` returns max 5 results (configurable)
- `AudioPlayerManager` reuses players per guild (Discord.js best practice)
- `commandLoader` validates `data` + `execute` properties exist
