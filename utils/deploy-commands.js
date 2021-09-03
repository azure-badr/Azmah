const fs = require('fs');
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, pakcordGuildId, token } = require("../config.json");

const commands = [];
const commandfiles = fs.readdirSync("../commands").filter(file => file.endsWith(".js"));

for (const file of commandfiles) {
    const command = require(`../commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(token);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, pakcordGuildId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
