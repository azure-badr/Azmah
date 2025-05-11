const {
  incrementConfessionNumber,
  addConfession,
  encrypt,
  confessionNumberButtonBuilder,
} = require("../utils/config");

const { 
  confessionsChannelId,
  modRoleId
} = require("../config");

MAX_MESSAGE_CONTENT_LIMIT = 1950

module.exports = {
  data: { name: "post" },
  async execute(message, ...content) {
    if (!message.inGuild()) return;

    if (!message.member.roles.cache.hasAny(modRoleId)) return;

    if (message.content.length > MAX_MESSAGE_CONTENT_LIMIT) {
      await message.channel.send({ content: `Confession too long! Your message goes ${message.content.length - MAX_MESSAGE_CONTENT_LIMIT} characters above the limit.`})
      return;
    }

    let confession = {}
    const number = await incrementConfessionNumber()

    const confessionsChannel = message.guild.channels.cache.get(confessionsChannelId);
    const confessionMessageOptions = {
      content: `**Confession ${number}**\n` + content.join(' '),
    }

    let confessionMessage
    confessionMessage = await confessionsChannel.send({
      ...confessionMessageOptions,
    })

    await message.channel.send({ content: "Your confession has been posted 🌴" })
    await addConfession({
      number,
      confessor_id: encrypt(message.author.id),
      confessor_name: encrypt(message.author.username),
      message_id: message.id,
      approved_message_id: confessionMessage.id,
      approved_message_url: confessionMessage.url,
      approved_by: message.author.id,
      approved: true,
      ...confession
    })
  },
}
