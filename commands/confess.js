const {
  guildId,
  confessionsApprovalChannelId,
} = require("../config");

const {
  encrypt,
  addConfession,
  confessionApprovalButtonsBuilder,
} = require("../utils/config");

module.exports = {
  data: { name: "confess" },
  async execute(message, ...content) {
    if (message.inGuild()) return;

    const guild = message.client.guilds.cache.get(guildId);
    const user = message.author;
    console.log(`Received guild ${guild}, ${user}`);
    const userDM = await user.createDM();
    console.log(`Opening DM with user ${userDM}`)

    const buttons = confessionApprovalButtonsBuilder();

    const confessionsApprovalChannel = guild.channels.cache.get(confessionsApprovalChannelId);
    const confessionsApprovalMessage = await confessionsApprovalChannel.send({
      content: content.join(' '),
      components: [buttons],
    });

    await userDM.send("💌 Your confession has been sent for approval.");
    await addConfession({
      confessor_id: encrypt(user.id),
      confessor_name: encrypt(user.username),
      message_id: message.id,
      approval_message_id: confessionsApprovalMessage.id,
    });
  },
};
