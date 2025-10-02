# PXNX Discord Bot

A feature-rich Discord bot built with TypeScript, Bun runtime, and Discord.js v14. The bot combines entertainment features, utility commands, and a complete music system with YouTube integration.

## 🎵 Music & Voice Features

### Interactive Music Player
- **YouTube Integration**: Search and play music directly from YouTube
- **Interactive Song Selection**: Choose from search results using Discord buttons
- **Queue Management**: Automatic queue progression with skip/stop controls
- **Voice Channel Support**: Seamless voice channel connection and management

### Music Commands
- `/play <song>` - Search YouTube and play music with interactive selection
- `/queue` - Display current music queue with song titles and requesters
- `/skip` - Skip the currently playing song
- `/stop` - Stop music and clear the entire queue
- `/next` - Show the next song coming up in the queue

## 🎮 Fun & Entertainment Commands

### Interactive Games
- `/coinflip` - Interactive coin flip game with heads/tails buttons (15-second timeout)
- `/8ball <question>` - Magic 8-ball with quirky, modern responses

### Random Generators
- `/peepee` - Humorous random "size" generator with creative descriptions
- `/weather <city>` - Real-time weather data with detailed forecasts

## 🔧 Utility Commands

- `/ping` - Check bot latency and responsiveness

## 🛠️ Technical Architecture

### Core Technologies
- **Runtime**: [Bun](https://bun.sh) - Fast JavaScript/TypeScript runtime
- **Discord Library**: Discord.js v14 with full TypeScript support
- **Voice Processing**: @discordjs/voice with Opus encoding
- **YouTube Integration**: youtubei.js (YouTube's InnerTube API client)
- **Audio**: ffmpeg-static for audio processing

### Command System
- **Modular Design**: Commands organized by category (fun, utility, voice)
- **Slash Commands**: Full Discord slash command integration
- **Interactive Components**: Buttons, collectors, and user interaction handling
- **Type Safety**: Complete TypeScript coverage with custom interfaces

### Music System Architecture
- **Queue Service**: Singleton service managing per-guild music queues
- **Audio Streaming**: Direct YouTube audio streaming with quality optimization
- **Connection Management**: Automatic voice connection lifecycle handling
- **Error Recovery**: Robust error handling with automatic queue progression

## 🚀 Setup & Installation

### Prerequisites
- [Bun](https://bun.sh) JavaScript runtime
- Discord Application with Bot Token
- OpenWeatherMap API Key (for weather command)
- Node.js (managed by mise)

### Environment Configuration
Create a `.env` file with the following variables:
```env
CLIENT_ID=your_discord_application_id
GUILD_ID=your_discord_guild_id
TOKEN=your_discord_bot_token
OPENWEATHERMAP_API_KEY=your_openweather_api_key
```

### Installation
```bash
# Install dependencies
bun install

# Deploy slash commands to Discord
bun run sync

# Start the bot in development mode
bun run dev
```

## 📋 Available Scripts

### Development
- `bun run dev` - Start bot with file watching for development
- `bun run index.ts` - Run bot directly without watching

### Command Management
- `bun run sync` - Deploy/update slash commands to Discord
- `bun run purge` - Remove all slash commands from Discord
- `bun run fetch` - List current commands registered with Discord

### Code Quality
- `bunx biome check --write` - Format and lint code using Biome

## 🎯 Key Features

### Discord Integration
- **Rich Embeds**: Beautiful, informative message embeds
- **Interactive Components**: Buttons, menus, and collectors
- **Error Handling**: Graceful error recovery with user feedback
- **Permission Handling**: Proper voice channel and guild permission checks

### Music Capabilities
- **YouTube Search**: Real-time search with multiple result options
- **Queue Management**: Per-guild queues with automatic progression
- **Audio Quality**: High-quality audio streaming with proper encoding
- **User Experience**: Interactive selection and queue feedback

### Weather Integration
- **Real-time Data**: Live weather information from OpenWeatherMap
- **Detailed Forecasts**: Temperature, humidity, wind speed, and conditions
- **Global Coverage**: Support for cities worldwide

## 🏗️ Project Structure

```
├── commands/
│   ├── fun/          # Entertainment commands
│   ├── utility/      # Utility commands
│   └── voice/        # Music and voice commands
├── events/           # Discord event handlers
├── types/            # TypeScript type definitions
├── utils/            # Shared utilities and services
├── index.ts          # Main bot entry point
└── deploy-commands.ts # Command deployment script
```

## 🔧 Development Notes

### Code Style
- **Formatting**: Tab indentation with Biome formatting
- **Linting**: ESLint + Biome for code quality
- **TypeScript**: Strict typing with custom interfaces
- **Imports**: ES6 modules with organized imports

### Testing Philosophy
- **TDD Workflow**: Test-driven development preferred
- **Reliability**: Tests as a means for faster, more reliable shipping
- **Quality Assurance**: Multiple testing paradigms as needed

### Dependencies
- **Maintenance**: Frequent dependency updates preferred
- **Quality Check**: All new dependencies vetted for maintenance status
- **Modern Stack**: Latest Node.js versions via mise

## 🤖 Bot Permissions Required

- `applications.commands` - For slash commands
- `Connect` - Join voice channels
- `Speak` - Play audio in voice channels
- `Send Messages` - Send command responses
- `Embed Links` - Send rich embeds
- `Read Message History` - For interaction handling

## ⚠️ Known Issues

### YouTube Playback (Currently Non-Functional)
Music playback is currently unavailable due to YouTube signature decipher failures in youtubei.js v15.1.1:

**Issue**: YouTube frequently updates their player code to prevent third-party scraping, causing signature deciphering to fail. This results in "This video is unavailable" errors for all videos, even when they exist.

**Attempted Solutions**:
- ✅ Implemented signature decipher detection during initialization
- ✅ Enhanced error messages with user-friendly guidance
- ⚠️ Tried multiple client types (WEB, ANDROID, IOS) - all failing
- ⚠️ Setting `retrieve_player: false` - still fails
- ⚠️ Using `player_id: "0004de42"` workaround - no effect

**Root Cause**: YouTube's anti-bot measures have evolved beyond what youtubei.js can currently handle without additional authentication (po_token, visitor_data, or OAuth).

**Potential Solutions** (not yet implemented):
1. Implement OAuth authentication with YouTube (complex setup)
2. Use po_token generation (requires additional infrastructure)
3. Switch to alternative music source (Spotify API, SoundCloud, etc.)
4. Wait for youtubei.js library updates (when/if they address this)

**Status**: Music search displays user-friendly error messages explaining the issue. All other bot features work normally.

## 📝 License

This project was created using `bun init` in bun v1.1.30.

---

*Built with 💜 using Bun, TypeScript, and Discord.js*