const { SlashCommandBuilder } = require("@discordjs/builders");
const { inlineCode, channelMention } = require("discord.js");
const { getConfessionByNumber, getConfessionByMessageId, decrypt } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("request")
    .setDescription("Request confession data by its number or message ID")
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName("number")
        .setDescription("Get confession data by its number")
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName("messageid")
        .setDescription("Get confession data by its message ID")
        .setRequired(false)
    ),
  async execute(interaction) {
    if (interaction.options.get("number")?.value && interaction.options.get("messageid")?.value) {
      interaction.reply({ content: "You can only specify one option at a time!", ephemeral: true });
      return;
    }

    if (interaction.options.get("number")?.value) {
      const confession = getConfessionByNumber(Number(interaction.options.get("number").value));
      if (!confession) {
        interaction.reply({
          content: "A confession with this number does not exist",
          ephemeral: true
        });
        return;
      }

      interaction.reply({
        content:
          `Confessor ID: ${inlineCode(decrypt(confession.confessorId))}\n
Confessor name: ${inlineCode(decrypt(confession.confessorName))}\n
Confession message ID: ${inlineCode(confession.confessionMessageId)}\n
Confession message ID on ${channelMention("418266761373417472")}: ${inlineCode(confession.confessionPostedMessageId)}\n
Please compare and verify the requested confession message ID in ${channelMention("418266761373417472")} with the one listed above`
      });
      return;
    }

    if (interaction.options.get("messageid")?.value) {
      const confession = getConfessionByMessageId(interaction.options.get("messageid").value);
      if (!confession) {
        interaction.reply({
          content: "A confession with this message ID does not exist",
          ephemeral: true
        });
        return;
      }

      interaction.reply({
        content:
          `Confessor ID: ${inlineCode(decrypt(confession.confessionRequestAuthorId))}\n
Confessor name: ${inlineCode(decrypt(confession.confessionRequestAuthorName))}\n
Confession message ID: ${inlineCode(confession.confessionMessageId)}\n
Confession message ID on ${channelMention("345588884996096000")}: ${inlineCode(confession.confessionsApprovalMessageId)}\n
Please compare and verify the requested confession message ID in ${channelMention("345588884996096000")} with the one listed above`
      });
      return;
    }
  }
}
