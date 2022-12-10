const { confessionsChannelId } = require("../config");
const { removeConfession } = require("../utils/config");

module.exports = {
  name: "messageDelete",
  once: false,
  async execute(message) {
    const messageChannel = message.channel;
    if (messageChannel.id !== confessionsChannelId) return;
    
    const messageId = message.id;
    console.log(`Attempting to delete confession ${messageId}`);
    
    const confession = await removeConfession(messageId);
    if (!confession) {
      console.log(`Confession ${messageId} not found`);
      return;
    }
    
    console.log(`Confession deleted`);
  }
}