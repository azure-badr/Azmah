const {
  guildId,
  confessionsApprovalChannelId,
  tatsuRequiredScore
} = require("../config");

const {
  encrypt,
  addConfession,
  confessionApprovalButtonsBuilder,
  getUserTatsuScore
} = require("../utils/config");

MAX_MESSAGE_CONTENT_LIMIT = 1950

module.exports = {
  data: { name: "confess" },
  async execute(message, ...content) {
    if (message.inGuild()) return;

    const user = message.author;
    console.log("Message length: ", message.content.length)
    if (message.content.length > MAX_MESSAGE_CONTENT_LIMIT) {
      await user.dmChannel.send(
        `Your confession is too long! It goes ${message.content.length - MAX_MESSAGE_CONTENT_LIMIT} characters above the limit`
      )
      return;
    }

    const guild = message.client.guilds.cache.get(guildId);
    const score = await getUserTatsuScore(guild.id, user.id) || 0;
    if (score < tatsuRequiredScore) {
      await user.dmChannel.send(
        `You must have a server score of at least **${tatsuRequiredScore} points** to send a confession!\nYou currently have **${score} points**. Contact staff for more information.`
      );
      return;
    }

    console.log(`Received guild ${guild}, ${user}`);

    const buttons = confessionApprovalButtonsBuilder();

    const confessionsApprovalChannel = guild.channels.cache.get(confessionsApprovalChannelId);
    const confessionsApprovalMessage = await confessionsApprovalChannel.send({
      content: content.join(' '),
      components: [buttons],
    });

    await user.dmChannel.send("💌 Your confession has been sent for approval.");
    await addConfession({
      confessor_id: encrypt(user.id),
      confessor_name: encrypt(user.username),
      message_id: message.id,
      approval_message_id: confessionsApprovalMessage.id,
    });
  },
};
