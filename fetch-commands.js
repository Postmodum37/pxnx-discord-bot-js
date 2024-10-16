const { REST, Routes } = require("discord.js");

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;

const rest = new REST({ version: "9" }).setToken(token);

(async () => {
  try {
    console.log("Fetching guild commands...");
    const guildCommands = await rest.get(
      Routes.applicationGuildCommands(clientId, guildId)
    );
    console.log("Guild commands:", guildCommands);

    console.log("Fetching global commands...");
    const globalCommands = await rest.get(Routes.applicationCommands(clientId));
    console.log("Global commands:", globalCommands);
  } catch (error) {
    console.error(error);
  }
})();
