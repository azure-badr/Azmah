const { SlashCommandBuilder } = require("@discordjs/builders");
const { inlineCode } = require("discord.js");
const { getConfession, decrypt } = require("../utils/config");

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
      const confession = await getConfession({ number: Number(interaction.options.get("number").value) });
      if (confession === null) {
        interaction.reply({
          content: "A confession with this number does not exist",
          ephemeral: true
        });
        return;
      }

      interaction.reply({
        content:
          `Confessor ID: ${inlineCode(decrypt(confession.confessor_id))}
Confessor name: ${inlineCode(decrypt(confession.confessor_name))}
Confession message ID: ${inlineCode(confession.message_id)}
Confession message ID on #confessions: ${inlineCode(confession.approved_message_id)}
Please compare and verify the requested confession message ID in #confessions with the one listed above`
      });
      return;
    }

    if (interaction.options.get("messageid")?.value) {
      const confession = await getConfession({ approval_message_id: interaction.options.get("messageid").value });
      if (confession === null) {
        interaction.reply({
          content: "A confession with this message ID does not exist",
          ephemeral: true
        });
        return;
      }

      interaction.reply({
        content:
          `Confessor ID: ${inlineCode(decrypt(confession.confessor_id))}
Confessor name: ${inlineCode(decrypt(confession.confessor_name))}
Confession message ID: ${inlineCode(confession.message_id)}
Confession message ID on #confessions-approval: ${inlineCode(confession.approval_message_id)}
Please compare and verify the requested confession message ID in #confessions-approval with the one listed above`
      });
      return;
    }
  }
}
