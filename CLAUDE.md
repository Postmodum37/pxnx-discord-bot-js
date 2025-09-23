# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment and Runtime

- **Runtime**: Bun (JavaScript/TypeScript runtime)
- **Language**: TypeScript with ES modules
- **Discord.js Version**: v14
- **Voice Support**: Uses @discordjs/voice and @discordjs/opus for audio playback

## Development Commands

### Core Commands
- `bun install` - Install dependencies
- `bun run dev` - Run in development mode with file watching
- `bun run index.ts` - Run the bot directly

### Command Management
- `bun run sync` - Deploy/sync slash commands to Discord (uses deploy-commands.ts)
- `bun run purge` - Remove all slash commands from Discord (uses reset-commands.ts)
- `bun run fetch` - Fetch current commands from Discord (uses fetch-commands.ts)

### Code Quality
- `bunx biome check --write` - Lint and format all files using Biome
- **Note**: The project uses both ESLint (.eslintrc.json) and Biome (biome.json) configurations

## Architecture

### Core Structure
- **index.ts**: Main entry point that initializes the Discord client, loads commands and events
- **ExtendedClient**: Custom client interface that extends Discord.js Client with a commands Collection
- **Command System**: Modular command structure organized in folders under `commands/`
- **Event System**: Event handlers in `events/` directory

### Command Categories
- `commands/fun/`: Entertainment commands (8ball, coinflip, weather, etc.)
- `commands/utility/`: Utility commands (ping, etc.)
- `commands/voice/`: Music/voice commands (play, stop, skip, next, queue)

### Key Components

#### Configuration (utils/config.ts)
- Singleton pattern for environment variables
- Required env vars: CLIENT_ID, GUILD_ID, TOKEN
- Throws errors for missing environment variables

#### Queue Service (utils/queueService.ts)
- Manages music queues per guild
- Handles YouTube audio streaming via ytdl-core
- Automatic queue progression and connection management
- Singleton service pattern

#### Command Interface (types/chatCommand.ts)
```typescript
interface ChatCommand {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
```

### Voice/Music Features
- YouTube search integration via @distube/ytsr
- Interactive song selection with Discord buttons
- Queue management with automatic playback progression
- Voice channel connection handling
- Audio streaming with ytdl-core and ffmpeg-static

## Code Style

### General Rules
- **Indentation**: Tabs (configured in both ESLint and Biome)
- **Quotes**: Double quotes for TypeScript (Biome), single quotes for JavaScript (ESLint)
- **Imports**: ES6 module imports, organized automatically by Biome
- **Semicolons**: Required
- **Brace Style**: Stroustrup style with single-line allowance

### TypeScript Patterns
- Use `type` imports for type-only imports
- Default exports for commands and events
- Interface definitions in dedicated `types/` directory
- Strict environment variable handling with runtime validation

## Environment Setup

Required `.env` file variables:
```
CLIENT_ID=your_discord_application_id
GUILD_ID=your_discord_guild_id
TOKEN=your_discord_bot_token
```

## Common Patterns

### Adding New Commands
1. Create TypeScript file in appropriate `commands/` subfolder
2. Export default object implementing `ChatCommand` interface
3. Commands are automatically loaded by category folder structure

### Adding New Events
1. Create TypeScript file in `events/` directory
2. Export default object with `name`, `execute`, and optional `once` properties
3. Events are automatically registered in index.ts

### Voice Command Development
- Always check if user is in voice channel before executing
- Use `queueService` for managing playback state
- Handle voice connection lifecycle properly
- Implement user interaction feedback with Discord components
- Use only Bun JavaScript runtime - https://bun.sh/
- Use https://discord.js.org/ and https://discordjs.guide/#before-you-begin to find information about interacting with discord API.
- Prefer TDD workflow. Use tests as means to ship features faster and more reliable. If needed - use other paradigms of testing. Do not tests straight interactions with Discord API that require extensive mocking. Test only easily tests parts that actually require tests.
- Prefer to update dependencies frequently and always use the newest nodejs version. NodeJS version is controller by mise.
- When adding new depedencies (libraries), check if they are well maintained, not abandoned and are right for the job.
- Use best linter/formatter approved by general javascript/typescript community, compatible with bun and generally well received by community.