# DISCORD BOT - PROJECT KNOWLEDGE BASE

TypeScript Discord music bot. Bun runtime, Discord.js v14, slash commands.

## OVERVIEW

Slash-command Discord bot with music playback via companion Searchy API. Modular command system, per-guild queues, structured logging.

## RUNTIME

- **Runtime**: Bun (JS/TS runtime)
- **Node**: 25.0.0 (controlled by `mise.toml`)
- **Discord.js**: v14 with `@discordjs/voice` + `@discordjs/opus`
- **Module system**: ES modules (`"type": "module"`)

## STRUCTURE

```
pxnx-discord-bot-js/
├── index.ts              # Entry point: client init, loads commands + events
├── commands/             # Slash commands by category (fun/utility/voice)
├── utils/                # Core services (singleton pattern)
├── types/                # ChatCommand, ExtendedClient, SearchyTypes
├── events/               # interactionCreate.ts, ready.ts
├── tests/                # Unit (utils/) + integration (integration/)
├── scripts/dev.ts        # Multi-service dev orchestrator
├── deploy-commands.ts    # Sync slash commands to Discord API
├── reset-commands.ts     # Remove all slash commands
└── fetch-commands.ts     # List registered commands
```

## ARCHITECTURE

### Core Concepts
- **ExtendedClient**: Custom Discord.js `Client` with `commands` Collection
- **Command loading**: `utils/commandLoader.ts` auto-discovers `commands/*/` subdirs
- **Event loading**: `utils/eventLoader.ts` auto-registers from `events/`
- **Both loaders** validate required properties before registration

### ChatCommand Interface
```typescript
interface ChatCommand {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
```

## CODE STYLE

- **Linter/Formatter**: Biome (not ESLint)
- **Indentation**: Tabs
- **Quotes**: Double quotes
- **Line Width**: 100 characters
- **Semicolons**: Required
- **Trailing Commas**: All (`"all"`)
- **Rules**: `noForEach` (error), `noExplicitAny` (error), `noUnusedVariables` (error), `noParameterAssign` (error)

## COMMANDS

```bash
# Development
bun run dev              # Full env: starts Searchy + bot with lifecycle management
bun run dev:bot          # Bot only with file watching
bun run start            # Production: direct execution

# Slash Command Management
bun run sync             # Deploy/sync commands to Discord
bun run purge            # Remove all commands from Discord
bun run fetch            # List current registered commands

# Code Quality
bun run lint             # Check with Biome
bun run lint:fix         # Auto-fix with Biome
bun run format           # Format with Biome
bun run typecheck        # tsc --noEmit

# Testing
bun run test             # Unit tests (fast, no deps)
bun run test:integration # Integration (auto-starts Searchy)
bun run test:all         # All tests
bun run test:watch       # Watch mode
```

## ENVIRONMENT

Required `.env` file:
```
CLIENT_ID=discord_application_id
GUILD_ID=discord_guild_id
TOKEN=discord_bot_token
OPENWEATHERMAP_API_KEY=optional_for_weather_command
SEARCHY_URL=http://localhost:8000  # optional, defaults to this
```

## MCP TOOLS GUIDANCE

### Serena MCP (Preferred for Code Navigation)
- `get_symbols_overview` first to understand a file
- `find_symbol` with `include_body=True` for specific symbols
- `find_referencing_symbols` for cross-file dependencies
- Prefer symbolic tools over reading entire files

### Tavily MCP (Web Research)
- Discord.js updates, audio streaming issues, yt-dlp changes

### Ref MCP (Documentation)
- Discord.js v14 APIs, @discordjs/voice, Bun runtime APIs
- Always include "TypeScript" in queries

## HIERARCHY

```
pxnx-discord-bot-js/AGENTS.md (this file)
├── commands/AGENTS.md
├── utils/AGENTS.md
└── tests/AGENTS.md
```
