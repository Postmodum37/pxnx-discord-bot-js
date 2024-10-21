const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
// Get token from environment variable
const token = process.env.TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

// Load js commands from each command folder
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Load typescript commands from each command folder
const tsCommandFolders = fs
  .readdirSync(foldersPath)
  .filter((folder) =>
    fs.statSync(path.join(foldersPath, folder)).isDirectory()
  );

for (const folder of tsCommandFolders) {
  const tsCommandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(tsCommandsPath)
    .filter((file) => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const tsFilePath = path.join(tsCommandsPath, file);
    const tsCommand = require(tsFilePath).default;
    if ("data" in tsCommand && "execute" in tsCommand) {
      client.commands.set(tsCommand.data.name, tsCommand);
    } else {
      console.log(
        `[WARNING] The command at ${tsFilePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(token);

// Log in to Discord with your client's token
client.login(token);
