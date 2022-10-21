const {
  tatsuRequiredScore,
  guildId,
  confessionsApprovalChannelId,
  confessionsChannelId,
  messageReplyNumberLimit,
} = require("../config");
const {
  doesReplyExist,
  encrypt,
  hasSufficientPoints,
  addConfession,
  getRecentConfessions,
  getConfessions,
  getAutocompleteChoices,
} = require("../utils/config");

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
    const guild = await interaction.client.guilds.cache.get(guildId);
    const channel = await guild.channels.cache.get(confessionsChannelId);

    const focusedValue = interaction.options.getFocused();
    if (focusedValue === "") {
      const confessions = await getRecentConfessions();
      const choices = await getAutocompleteChoices(channel, confessions);

      return await interaction.respond(choices)
    }

    const confessions = await getConfessions({ number: Number(focusedValue) });
    const choices = await getAutocompleteChoices(channel, confessions);

    return await interaction.respond(choices);
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
    } catch { }

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
    await interaction.reply(
      `💌 Your confession has been sent for approval. 
      ${interaction.inGuild() ? 'You\'re better off confessing in my DMs... (the way its intended) 🤫' : ''}`
    );
    await addConfession({
      confessor_id: encrypt(interaction.user.id),
      confessor_name: encrypt(interaction.user.username),
      message_id: (await interaction.fetchReply()).id,
      approval_message_id: confessionsApprovalMessage.id,
      ...confession
    })
  },
};
