const {
  getConfessionNumber,
  getConfessionByConfessionId,
  addConfession,
  updateConfessionNumber
} = require("../utils/config");
const { confessionsChannelId } = require("../config");

const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageButton } = require("discord.js");
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
    const replyValue = interaction.options.get("replyto")?.value;
    if (replyValue && !getConfessionByConfessionId(Number(replyValue))) {
      interaction.reply({ content: "This confession does not exist! 📭" });
      return;
    }

    let confessionNumber = getConfessionNumber();
    const confessionsChannel = interaction.guild.channels.cache.get(confessionsChannelId);
    const confessionMessage = {
      content: `${interaction.options.get("message").value}`,
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId((confessionNumber++).toString())
            .setLabel(`Confession ${confessionNumber}`)
            .setStyle("SECONDARY")
            .setDisabled()
        ),
      ],
    }

    let sentConfessionMessage;
    if (replyValue) {
      let confessionRepliedToId = getConfessionByConfessionId(Number(replyValue)).id;
      confessionsChannel.messages.fetch(confessionRepliedToId)
        .then(async message => {
          sentConfessionMessage = await message.reply(confessionMessage);
          addConfession(
            {
              postedByModerator: true,
              confessionNumber,
              confessorName: interaction.user.username,
              confessorId: interaction.user.id,
              confessionPostedMessageUrl: sentConfessionMessage.url,
              confessionPostedMessageId: sentConfessionMessage.id,
              confessionMessageContent: interaction.options.get("message").value,
              confessionReplyTo: replyValue
            }
          );
          updateConfessionNumber(confessionNumber);
        });
      interaction.reply({ content: "Your confession has been posted" });
      return;
    }

    sentConfessionMessage = await confessionsChannel.send(confessionMessage);
    addConfession(
      {
        postedByModerator: true,
        confessionNumber,
        confessorName: interaction.user.username,
        confessorId: interaction.user.id,
        confessionPostedMessageUrl: sentConfessionMessage.url,
        confessionPostedMessageId: sentConfessionMessage.id,
        confessionMessageContent: interaction.options.get("message").value,
      }
    );
    updateConfessionNumber(confessionNumber);
    interaction.reply({ content: "Your confession has been posted" });
  },
}
