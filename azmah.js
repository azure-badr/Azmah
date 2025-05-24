const initializeDatabase = require("./database");
const { token } = require("./config");

const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  Collection,
  Partials
} = require("discord.js");

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages, 
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});
initializeDatabase()

client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync(`./events`).filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.on("messageCreate", async (message) => {
  const prefix = ".";
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, ...args);
  } catch (error) {
    console.error(error);
    if (message.channel) {
      await message.channel.send("Something went wrong executing this command.");
      return;
    }
    
    await message.author.dmChannel.send("Something weng wrong executing this command.")
  }
});

client.login(token);
