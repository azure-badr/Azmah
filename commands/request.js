const { inlineCode, DiscordAPIError } = require("discord.js");
const { getConfession, decrypt } = require("../utils/config");

const { ownerRoleId } = require("../config");

module.exports = {
  data: { name: "request" },
  async execute(message, ...content) {
    if (!message.inGuild()) return;

    if (ownerRoleId === undefined) return;
    if (!message.member.roles.cache.hasAny(ownerRoleId)) return;
    
    if (content.length > 1) {
      await message.channel.send("Invalid use of the command. Specify either the message ID of the confession in the approvals channel, or the confession number");
      return;
    }

    const number = content[0];
    if (!/^\d+$/.test(number)) {
      await message.channel.send("Specify a confession number or a message ID found in the approvals channel");
      return;
    }

      let confession = null;
      confession = await getConfession({ number });
      if (!confession) {
        confession = await getConfession({ approval_message_id: number });
      }

      if (!confession) {
        await message.channel.send("A confession with this number does not exist");
        return;
      }

      try {
        await message.member.send([
          `Confessor ID: ${inlineCode(decrypt(confession.confessor_id))}`,
          `Confessor name: ${inlineCode(decrypt(confession.confessor_name))}`,
          `Confession message ID: ${inlineCode(confession.message_id)}`,
          `Confession message ID on #confessions: ${inlineCode(confession.approved_message_id)}`,
          `Please compare and verify the requested confession message ID in #confessions with the one listed above`
        ].join('\n'));
        
        await message.channel.send("The confession has been sent in your DMs. Please check");
      } catch (error) {
        if (error instanceof DiscordAPIError) {
          await message.channel.send("Your DMs need to be open for me to send the confession!");
          return;
        }
        
        await message.channel.send("Something went wrong!");
        console.log(error);
      }
    }
}
