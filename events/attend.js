const {
  confessionsChannelId,
} = require("../config");
const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

const {
  getConfession,
  rejectConfession,
  approveConfession,
  incrementConfessionNumber,
  getConfessionNumber,
  getConfessionIdByNumber
} = require("../utils/config.js");
const { postConfession } = require("../utils/config");

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
    if (interaction.component.customId === "rejected") {
      return await rejectConfession(interaction)
    }

    await postConfession(interaction)
    
    messageIds.delete(interaction.message.id);
  }
};
