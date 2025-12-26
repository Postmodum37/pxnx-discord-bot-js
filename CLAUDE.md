# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment and Runtime

- **Runtime**: Bun (JavaScript/TypeScript runtime)
- **Language**: TypeScript with ES modules
- **Node Version**: 25.0.0 (controlled by mise.toml)
- **Discord.js Version**: v14
- **Voice Support**: Uses @discordjs/voice and @discordjs/opus for audio playback

## Development Commands

### Core Commands
- `bun install` - Install dependencies
- `bun run dev` - Run in development mode with file watching
- `bun run start` - Run the bot directly

### Command Management
- `bun run sync` - Deploy/sync slash commands to Discord
- `bun run purge` - Remove all slash commands from Discord
- `bun run fetch` - Fetch current commands from Discord

### Code Quality
- `bun run lint` - Check linting issues with Biome
- `bun run lint:fix` - Fix linting issues with Biome
- `bun run format` - Format code with Biome
- `bun run typecheck` - Run TypeScript type checking

### Testing
- `bun test` - Run all tests
- `bun test --watch` - Run tests in watch mode
- `bun test tests/utils/validation.test.ts` - Run a specific test file

## Architecture

### Core Structure
- **index.ts**: Main entry point - initializes Discord client, loads commands and events via loaders
- **ExtendedClient**: Custom client interface extending Discord.js Client with a commands Collection
- **Command System**: Modular commands organized in folders under `commands/` (auto-loaded by category)
- **Event System**: Event handlers in `events/` directory (auto-registered)

### Key Services

#### SearchyService (utils/searchyService.ts)
- HTTP client for the companion Searchy API (Python/FastAPI service)
- Handles YouTube search queries and audio stream URL retrieval
- Singleton pattern with retry logic for resilience
- **Required**: Searchy service must be running for music features (see parent CLAUDE.md)

#### QueueService (utils/queueService.ts)
- Manages per-guild music queues
- Handles audio streaming from YouTube via Searchy's URLs
- Automatic queue progression with AudioPlayer lifecycle management
- Cleanup timer for inactive queues (TTL: 1 hour)

#### AudioPlayerManager (utils/audioPlayerManager.ts)
- Manages Discord.js AudioPlayer instances per guild
- Reuses players to follow Discord.js best practices

### Command Interface (types/chatCommand.ts)
```typescript
interface ChatCommand {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
```

## Code Style

- **Formatter/Linter**: Biome (no ESLint)
- **Indentation**: Tabs
- **Quotes**: Double quotes
- **Line Width**: 100 characters
- **Semicolons**: Required
- **Trailing Commas**: All
- **Linting Rules**: No forEach loops, no explicit any, no unused variables

## Environment Setup

Required `.env` file variables:
```
CLIENT_ID=your_discord_application_id
GUILD_ID=your_discord_guild_id
TOKEN=your_discord_bot_token
SEARCHY_URL=http://localhost:8000  # optional, defaults to this
```

## Adding New Commands

1. Create TypeScript file in appropriate `commands/` subfolder (fun/, utility/, voice/)
2. Export default object implementing `ChatCommand` interface
3. Run `bun run sync` to deploy to Discord

## Testing Approach

- Use Bun's built-in test runner (`bun:test`)
- Test utilities and business logic (see `tests/utils/`)
- Avoid testing Discord API interactions that require extensive mocking
- TDD workflow preferred for faster, more reliable feature development

## MCP Tools

Claude Code has access to several MCP servers for enhanced capabilities:

### Tavily MCP

Use for web search and content extraction:

- `tavily-search` - Search the web for current information, news, or general queries
- `tavily-extract` - Extract content from specific URLs (use `extract_depth: "advanced"` for LinkedIn)
- `tavily-crawl` - Crawl websites starting from a base URL with depth/breadth control
- `tavily-map` - Map website structure to discover URLs and navigation paths

**When to use**: Researching Discord.js updates, finding solutions to audio streaming issues, checking yt-dlp changes, or gathering information about new Discord API features.

### Serena MCP

Semantic coding tools for intelligent codebase navigation:

- `find_symbol` - Find symbols (classes, functions, methods) by name path pattern
- `get_symbols_overview` - Get high-level overview of symbols in a file
- `find_referencing_symbols` - Find all references to a symbol
- `replace_symbol_body` - Replace an entire symbol's definition
- `insert_before_symbol` / `insert_after_symbol` - Insert code around symbols
- `search_for_pattern` - Regex search across codebase with context
- `rename_symbol` - Rename a symbol across the entire codebase

**When to use**: Prefer Serena's symbolic tools over reading entire files. Use `get_symbols_overview` first to understand a file, then `find_symbol` with `include_body=True` only for symbols you need to examine or edit.

### Ref MCP

Documentation search and retrieval:

- `ref_search_documentation` - Search for library/framework documentation (include language and framework names in query)
- `ref_read_url` - Read documentation content from a URL returned by search

**When to use**: Looking up Discord.js v14 APIs, @discordjs/voice patterns, Bun runtime APIs, or any library documentation. Always include "TypeScript" or "JavaScript" in queries for this project.
