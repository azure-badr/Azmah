const {
  rejectConfession,
  processConfessionQueue
} = require("../utils/config.js");

const queue = require("../confession-queue/queue");

const messageIds = new Map();

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    // If button was already pressed
    if (messageIds.get(interaction.message.id)) {
      interaction.reply({ content: "This confession has already been replied to", ephemeral: true });
      return;
    }
    
    messageIds.set(interaction.message.id, true);
    
    await interaction.deferUpdate();
    if (interaction.component.customId === "rejected") {
      return await rejectConfession(interaction)
    }
    
    queue.push(interaction)
    if (queue.length >= 1) {
      await processConfessionQueue(interaction);
      messageIds.delete(interaction.message.id);
    }
  }
};
