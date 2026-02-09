# COMMANDS - SLASH COMMAND MODULES

Auto-discovered slash commands organized by category subdirectory.

## OVERVIEW

12 commands across 3 categories. Each file exports a `ChatCommand` default export. Loaded dynamically by `utils/commandLoader.ts`.

## STRUCTURE

```
commands/
├── fun/                  # Entertainment commands
│   ├── 8ball.ts          # Magic 8-ball with random responses
│   ├── coinflip.ts       # Coin flip
│   ├── peepee.ts         # Fun size generator (165 lines — largest fun cmd)
│   └── weather.ts        # Weather lookup (OpenWeatherMap API)
├── utility/              # Information commands
│   ├── ping.ts           # Bot latency measurement
│   ├── server.ts         # Server info
│   └── user.ts           # User info
└── voice/                # Music/audio commands (depend on Searchy)
    ├── play.ts           # Search + select + queue (214 lines — most complex)
    ├── next.ts           # Skip to next in queue
    ├── skip.ts           # Skip current track
    ├── queue.ts          # Display current queue
    └── stop.ts           # Stop playback, clear queue
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add new command | `{category}/newCommand.ts` | Implement `ChatCommand`, run `bun run sync` |
| Understand command flow | `voice/play.ts` | Full search → select → queue → play flow |
| Simple command example | `utility/ping.ts` | Minimal command with error handling |
| Embed usage example | `fun/8ball.ts` | EmbedBuilder with SlashCommandBuilder |
| Button interactions | `voice/play.ts` | ActionRowBuilder + ButtonBuilder + collector |

## CONVENTIONS

### Command Template
```typescript
import type { ChatCommand } from "../../types/chatCommand";

const command: ChatCommand = {
  data: new SlashCommandBuilder()
    .setName("name")
    .setDescription("Description"),

  async execute(interaction: ChatInputCommandInteraction) {
    // implementation
  },
};

export default command;
```

### Error Handling Pattern
```typescript
try {
  // command logic
} catch (error) {
  if (error instanceof ValidationError) {
    await interaction.reply({ content: error.message, ephemeral: true });
    return;
  }
  logger.error("Command failed", error as Error, { userId: interaction.user.id });
  // attempt fallback reply
}
```

### Voice Commands
- Must validate: voice channel connection, guild ID, song input
- Use `deferReply()` before async work, then `editReply()` (never `reply()` after defer)
- Access services via `SearchyService.getInstance()` and `queueService` (module export)
- Button collectors: 30s timeout (`SELECTION_TIMEOUT`)

## ANTI-PATTERNS

- **Never** `reply()` after `deferReply()` — use `editReply()`
- **Never** skip input validation in voice commands
- **Never** use `MessageFlags.Ephemeral` (deprecated) — use `{ ephemeral: true }` or `MessageFlags.Ephemeral`
- **Never** forget to handle collector timeout/end events

## NOTES

- Categories = subdirectory names (auto-discovered, no registration needed)
- Run `bun run sync` after adding/modifying command names or options
- Voice commands require Searchy running for search/audio features
- `play.ts` is the most complex: search → button grid → selection → queue → voice join → stream
