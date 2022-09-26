const {
  getConfessionIdByNumber,
  incrementConfessionNumber,
  addConfession,
  encrypt,
  getConfessionNumber,
  doesReplyExist
} = require("../utils/config");
const { confessionsChannelId } = require("../config");

const { SlashCommandBuilder } = require("@discordjs/builders");
const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("post")
    .setDescription("Post a confession")
    .setDefaultMemberPermissions('0')
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The confession message")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("replyto")
        .setDescription("Reply to a confession with their confession number")
        .setRequired(false)
    ),

  async execute(interaction) {
    let confession = {}
    const reply = interaction.options.get("replyto")
    try {
      if (!(await doesReplyExist(reply)))
        return interaction.reply({ content: "A confession with this number does not exist", ephemeral: true })
      
      if (Number(reply.value) === 0)
      return interaction.reply({ content: "What are you trying to do? 🤔" })

      confession.reply_to = reply.value
    } catch { } }

    await incrementConfessionNumber()
    const number = await getConfessionNumber()

    const confessionsChannel = interaction.guild.channels.cache.get(confessionsChannelId);
    const confessionMessageOptions = {
      content: `${interaction.options.get("message").value}`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId((number).toString())
            .setLabel(`Confession ${number}`)
            .setStyle("Secondary")
            .setDisabled()
        ),
      ],
    }
    let confessionMessage

    // If reply exists
    let messageToReplyTo = null;
    if ("reply_to" in confession)
      messageToReplyTo
        = await confessionsChannel.messages.fetch((await getConfessionIdByNumber(confession.reply_to)))

    confessionMessage = await confessionsChannel.send({
      ...confessionMessageOptions,
      reply: {
        messageReference: messageToReplyTo?.id
      }
    })

    await interaction.reply({ content: "Your confession has been posted 🌴" })
    await addConfession({
      number,
      confessor_id: encrypt(interaction.user.id),
      confessor_name: encrypt(interaction.user.username),
      message_id: (await interaction.fetchReply()).id,
      approved_message_id: confessionMessage.id,
      approved_message_url: confessionMessage.url,
      approved_by: interaction.user.id,
      approved: true,
      ...confession
    })
  },
}
