const {
  approveEmoji,
  rejectEmoji,
  pakcordGuildId,
  confessionsApprovalChannelId,
} = require("../config.json");
const { addConfessionRequest, pushToConfessionQueue, getConfessionByConfessionId, encrypt } = require("../utils/config");

const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = {

  // Command building
  data: new SlashCommandBuilder()
    .setName("confess")
    .setDescription("Sends a confession to the server")
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

  // Command functionality
  async execute(interaction) {
    const replyValue = interaction.options.get("replyto")?.value;
    if (replyValue && !getConfessionByConfessionId(Number(replyValue))) {
      interaction.reply({ content: "This confession does not exist! 📭" });
      return;
    }

    const confessionMessage = interaction.options.get("message").value;
    const pakcordGuild = interaction.client.guilds.cache.get(pakcordGuildId);
    const confessionsApprovalChannel = pakcordGuild.channels.cache.get(confessionsApprovalChannelId);
    let confessionRequest = {};

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId("approved")
          .setLabel("Approve")
          .setStyle("SUCCESS")
          .setEmoji(approveEmoji)
      )
      .addComponents(
        new MessageButton()
          .setCustomId("rejected")
          .setLabel("Reject")
          .setStyle("DANGER")
          .setEmoji(rejectEmoji)
      );
    
    let repliedConfession;
    if (replyValue) {
      repliedConfession = getConfessionByConfessionId(Number(replyValue));
      row.addComponents(
        new MessageButton()
          .setLabel(`Reply to ${replyValue}`)
          .setStyle("LINK")
          .setURL(repliedConfession.url)
      );
    }

    const confessionsApprovalMessage = await confessionsApprovalChannel.send({
      content: `${confessionMessage}`,
      components: [row],
    });
    await interaction.reply("💌 Your confession has been sent for approval.");

    interaction.fetchReply().then(async (message) => {
      confessionRequest = {
        ...(replyValue && {
          confessionRequestReplyTo: replyValue,
          confessionRequestReplyMessageId: repliedConfession.id,
        }),
        confessionRequestAuthorId: encrypt(interaction.user.id),
        confessionRequestAuthorName: encrypt(interaction.user.username),
        confessionMessageId: message.id,
        confessionRequestMessageContent: encrypt(confessionMessage),
        confessionsApprovalMessageId: confessionsApprovalMessage.id,
      };

      pushToConfessionQueue(confessionRequest);
      addConfessionRequest(confessionRequest);
    });
  },
};
