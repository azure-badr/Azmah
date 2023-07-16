const { getRecentConfessionsDB, updateRecentConfessions, formatConfessionText } = require("../utils/config");
const { confessionsChannelId } = require("../config");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}, ${client.user.id}`);

    console.log('Fetching and updating recent confessions');
    const channel = await client.channels.cache.get(confessionsChannelId);

    const recentConfessions = await getRecentConfessionsDB();
    recentConfessions.forEach(async (confession, index) => {
      const message = await channel.messages.fetch(confession.approved_message_id);
      const messageContent = formatConfessionText(message.content, confession.number);

      updateRecentConfessions({
        number: confession.number.toString(),
        content: messageContent
      });

      console.log(`Updated confession nuumber ${confession.number} in recent confessions ${index + 1}/5}`);
    });
    console.log('Finished fetching and updating recent confessions');
  },
};
