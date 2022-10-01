const {
  tatsuRequiredScore,
  guildId,
  confessionsApprovalChannelId,
  messageReplyNumberLimit
} = require("../config");
const { doesReplyExist, encrypt, hasSufficientPoints, addConfession } = require("../utils/config");

const { SlashCommandBuilder } = require("@discordjs/builders");
const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

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
        .setAutocomplete(true)
    ),
  // Autocomplete functionality
  autoComplete: async (interaction) => {
    const focusedValue = interaction.options.getFocused();

    // Make query to database, get some query back
    if (focusedValue === "") {
      const choices = [
        '10000 - Hello world', 
        '10001 - Some confession', 
        '10002 - Some long confession', 
        '10003 - Some very long confession', 
        '10004 - Some even longer confession'
      ];
      const filtered = choices.filter(choice => choice.startsWith(focusedValue));
      return await interaction.respond(
        filtered.map(choice => ({ name: choice, value: choice })),
      );
    }

    return await interaction.respond(
      [
        { name: "30484 - Lorem ipsum dolor sit amet, consectetur adipiscing elit.  ", value: "30484" },
        { name: "30483 - Suspendisse tempus augue consequat metus ultrices", value: "30483" },
        { name: "30482 - Ac blandit nunc blandit.", value: "30482" },
        { name: "30481 - Lorem ipsum dolor sit amet", value: "30481" },
      ],
    )

  },
  // Command functionality
  async execute(interaction) {
    const guild = interaction.client.guilds.cache.get(guildId);

    if (!(await hasSufficientPoints(guild.id, interaction.user.id))) {
      interaction.reply({
        content: `You must have a score of at least ${tatsuRequiredScore} to send a confession!\nCheck your score in the server by typing t!rank`
      });
      return;
    }

    let confession = {}
    const reply = interaction.options.get("replyto")
    try {
      if (!(await doesReplyExist(reply)))
        return interaction.reply({ content: "A confession with this number does not exist 🌴", ephemeral: true })

      confession.reply_to = reply.value 
    } catch { 
      if (Number(reply.value) <= messageReplyNumberLimit)
        return interaction.reply({ content: `You can only respond to confessions after ${messageReplyNumberLimit}` })
    }

    const messageContent = interaction.options.get("message").value;
    const confessionsApprovalChannel = guild.channels.cache.get(confessionsApprovalChannelId);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("approved")
          .setLabel("Approve")
          .setStyle("Primary")
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("rejected")
          .setLabel("Reject")
          .setStyle("Danger")
      );

    const confessionsApprovalMessage = await confessionsApprovalChannel.send({
      content: `${messageContent}`,
      components: [row],
    });
    await interaction.reply("💌 Your confession has been sent for approval.");
    await addConfession({
      confessor_id: encrypt(interaction.user.id),
      confessor_name: encrypt(interaction.user.username),
      message_id: (await interaction.fetchReply()).id,
      approval_message_id: confessionsApprovalMessage.id,
      ...confession
    })
  },
};
