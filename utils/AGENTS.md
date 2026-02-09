# UTILS - SERVICE LAYER

Core services for Discord bot. All singletons. All use structured logging.

## OVERVIEW

10 files: Searchy API client, music queue, audio player management, validation, logging, config, embeds, loaders.

## STRUCTURE

```
utils/
├── searchyService.ts     # HTTP client for Searchy API (retry logic, URL parsing)
├── queueService.ts       # Per-guild music queues (TTL cleanup, audio streaming)
├── audioPlayerManager.ts # Discord.js AudioPlayer instances per guild
├── validation.ts         # Input validation with ValidationError
├── logger.ts             # Structured logging (debug/info/warn/error)
├── config.ts             # Environment variable loader (.env)
├── embedFactory.ts       # Discord embed builders
├── commandLoader.ts      # Dynamic command discovery from commands/
├── eventLoader.ts        # Event handler registration from events/
└── randomElement.ts      # Array utility (default export)
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add retry logic | `searchyService.ts` | `retry()` method with configurable attempts |
| Change queue TTL | `queueService.ts` | `CLEANUP_INTERVAL` and `INACTIVE_TTL` constants |
| Add validation rule | `validation.ts` | Follow `validateString()` pattern, throw `ValidationError` |
| Custom embed | `embedFactory.ts` | Add new builder function |
| Add log level | `logger.ts` | Extend `LogLevel` enum |
| URL/ID parsing | `searchyService.ts` | `extractVideoId()`, `formatDuration()` |

## SERVICE DEPENDENCIES

```
Commands
  └── QueueService (module-level instance)
        ├── SearchyService.getInstance() → getAudioStreamUrl
        ├── AudioPlayerManager.getOrCreate(guildId)
        └── logger
```

## CONVENTIONS

### Singleton Pattern
```typescript
private static instance: ServiceName | null = null;
static getInstance(): ServiceName { ... }
```
- Classes: `SearchyService`, `AudioPlayerManager` → `getInstance()`
- Modules: `queueService` → direct export (not class-based)

### Cleanup Timer
- Interval: 30 minutes (`CLEANUP_INTERVAL`)
- TTL: 1 hour inactivity (`INACTIVE_TTL`)
- `lastActivity` updated on every queue operation

### Validation
- Always throw `ValidationError` (not generic `Error`)
- Commands catch `ValidationError` → user-friendly ephemeral message
- Validate all user input: `validateString()`, `validateGuildId()`, `validateVoiceChannel()`

### Logging
```typescript
logger.info("Message", { guildId, userId, ...context });
```
- Context object as second param (never string concatenation)
- Always include relevant IDs (guildId, userId)

## ANTI-PATTERNS

- **Never** `new SearchyService()` — use `getInstance()`
- **Never** skip validation for user input
- **Never** `console.log` — use `logger.*`
- **Never** forget `lastActivity` update on queue mutations

## KEY INTERFACES

```typescript
interface QueueItem { url: string; title: string; requestedBy: string; addedAt: Date; }
interface AudioStreamInfo { url: string; title: string; format: { id, ext, codec, bitrate }; expiresIn: number; }
interface SearchResult { id: string; title: string; duration: number; channel: string; thumbnail: string; }
```

## NOTES

- `SearchyService` constructor accepts `maxResults` param (default 5)
- `AudioPlayerManager` reuses players per guild (Discord.js best practice — one player per connection)
- `commandLoader` validates both `data` and `execute` properties exist on imports
- `eventLoader` supports both `once` and `on` event registration
