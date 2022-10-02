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

    await incrementConfessionNumber()
    const number = await getConfessionNumber()

    const confessionsChannel = interaction.guild.channels.cache.get(confessionsChannelId);
    const confessionMessageOptions = {
      content: `${interaction.message.content}`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(number.toString())
            .setLabel(`Confession ${number}`)
            .setStyle("Secondary")
            .setDisabled()
        ),
      ],
    }

    await interaction.update({
      components:
        [new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`acptd-by-${interaction.user.username}`)
            .setLabel(`Accepted by ${interaction.user.username}`)
            .setStyle("Success")
            .setDisabled()
        )]
    })

    const confession = await getConfession({ approval_message_id: interaction.message.id })
    let messageToReplyTo = null;
    if (confession.reply_to !== 0)
      messageToReplyTo
        = await confessionsChannel.messages.fetch((await getConfessionIdByNumber(confession.reply_to)))

    const confessionMessage = await confessionsChannel.send({
      ...confessionMessageOptions,
      reply: {
        messageReference: messageToReplyTo?.id
      }
    })
    await approveConfession(interaction, {
      number,
      approved_message_id: confessionMessage.id,
      approved_message_url: confessionMessage.url,
      approved_by: interaction.user.id,
      approved: true,
    });
    messageIds.delete(interaction.message.id);
  }
};
