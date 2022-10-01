const fs = require('fs');
const { Routes } = require("discord.js")
const { REST } = require("@discordjs/rest");
const { clientId, guildId, token } = require("./config");

const commands = [];
const commandfiles = fs.readdirSync("/commands").filter(file => file.endsWith(".js"));

for (const file of commandfiles) {
  const command = require(`/commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then((data) => console.log(`Successfully registered ${data.length} application commands.`))
	.catch(console.error);
