const Confession = require("../database/models/ConfessionModel")
const MetadataConfession = require("../database/models/MetadetaModel")

const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

const crypto = require("crypto");
const fetch = require("cross-fetch");

const algorithm = "aes-256-ctr";
const ENCRYPTION_KEY = process.env.CONFESSION_ENCRYPTION_PASSWORD;
const IV_LENGTH = 16;

const { tatsuApiKey, tatsuApiUrl, tatsuRequiredScore, confessionsChannelId, confessionMetadetaId } = require("../config.js");

const queue = require("../confession-queue/queue");

const recentConfessions = []

module.exports = {
  async hasSufficientPoints(guildId, userId) {
    const userPointsEndpoint = `guilds/${guildId}/rankings/members/${userId}/all`;

    const response = await fetch(`${tatsuApiUrl}${userPointsEndpoint}`, {
      headers: {
        "Content-Type": "application/json",
        "authorization": `${tatsuApiKey}`
      }
    });

    return (await response.json()).score >= tatsuRequiredScore;
  },
  /**
   * Builds a confession button for when a confession is posted 
   * @param {String} number  The number of the new confession
   * @return {ActionRowBuilder} The button with the new confession number
   */
   confessionNumberButtonBuilder(number) {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(number.toString())
          .setLabel(`Confession ${number}`)
          .setStyle("Secondary")
          .setDisabled()
      ),
    ]
  },
  /**
   * Builds a confession button for when a confession is attended 
   * @param {Boolean} status  The status of the confession (approved/rejected)  
   * @param {String} name  The name associated with person attending this confession 
   * @return {ActionRowBuilder} The button indicating how the confession was attended
   */
  confessionAttendButtonBuilder(status, name) {
    return [new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(
          status ?
            `acptd-by-${name}` :
            `rjtd-by-${name}`
          )
        .setLabel(
          status ?
          `Accepted by ${name}` :
          `Rejected by ${name}`
          )
        .setStyle(status ? "Success" : "Danger")
        .setDisabled()
    )]
  },
  /**
   * Removes a confession from the database
   * @param {String} id The id of the confession to remove
   */
  async removeConfession(messageId) {
    return await Confession.findOneAndDelete({ approved_message_id: messageId })
  },
  async incrementConfessionNumber() {
    return (await MetadataConfession.findByIdAndUpdate(
      confessionMetadetaId, { $inc: { number: 1 } }, { new: true }
    )).number
  },
  async addConfession(confession) {
    await Confession.create(confession)
  },
  async getConfession(filter) {
    return (await Confession.findOne(filter))
  },
  async getConfessions(filter) {
    return (await Confession.find(filter))
  },
  async getRecentConfessions() {
    return (
      await Confession.find({ approved: true }).sort({ number: -1 }).limit(5)
    )
  },
  async getAutocompleteChoices(channel, confessions) {
    if (confessions === null || confessions.length === 0) return [];

    return await Promise.all(
      confessions.map(async (confession) => {
        const message = await channel.messages.fetch(
          confession.approved_message_id
        );
        return {
          name:
            message.content.length > 30
              ? `${confession.number} - ${message.content.slice(0, 30) + "..."}`
              : `${confession.number} - ${message.content}`,
          value: confession.number.toString(),
        };
      })
    );
  },
  async rejectConfession(interaction) {
    await interaction.editReply({
      components: module.exports.confessionAttendButtonBuilder(false, interaction.user.username)
    })

    await Confession.findOneAndUpdate(
      { approval_message_id: interaction.message.id },
      { rejected_by: interaction.user.id }
    )
  },
  async postConfession(interaction) {
    const number = await module.exports.incrementConfessionNumber()
    // Build disabled button from that number

    const confessionsChannel = interaction.guild.channels.cache.get(confessionsChannelId);
    const confessionMessageOptions = {
      content: `${interaction.message.content}`,
      ...(interaction.message.attachments.size > 0 && {
        files: interaction.message.attachments.map((attachment) => ({
          name: attachment.name,
          attachment: attachment.url,
        })),
      }),
      components: module.exports.confessionNumberButtonBuilder(number),
    }

    // Get confession from database and send
    const confession = await module.exports.getConfession({ approval_message_id: interaction.message.id })

    // Check if the confession is a reply, if it is then attach a reply option
    let messageToReplyTo = null;
    if (confession.reply_to !== 0)
      messageToReplyTo
        = await confessionsChannel.messages.fetch(
          (await module.exports.getConfessionIdByNumber(confession.reply_to))
        )

    // Send the confession
    const confessionMessage = await confessionsChannel.send({
      ...confessionMessageOptions,
      reply: {
        messageReference: messageToReplyTo?.id
      }
    });

    await module.exports.updateRecentConfessions({
      number,
      // If the message content length is greater than 30, then slice it to 30 and add ...
      content:
        confessionMessage.content.length > 30
          ? `${confessionMessage.content.slice(0, 30) + "..."}`
          : confessionMessage.content,
    });
    
    // Set confession as approved in the database and update button in confessions-appproval
    return await module.exports.approveConfession(interaction, {
      number,
      approved_message_id: confessionMessage.id,
      approved_message_url: confessionMessage.url,
      approved_by: interaction.user.id,
      approved: true,
    });
  },
  async approveConfession(interaction, confession) {
    await interaction.editReply({
      components: module.exports.confessionAttendButtonBuilder(true, interaction.user.username)
    })

    return await Confession.findOneAndUpdate(
      { approval_message_id: interaction.message.id },
      confession
    )
  },
  async processConfessionQueue() {
    const confession = queue.shift();
    
    if (!confession)
      return;
    
    const postedConfession = await module.exports.postConfession(confession);
    if (postedConfession)
      await module.exports.processConfessionQueue();
  },
  recentConfessions: recentConfessions,
  async updateRecentConfessions(confession) {
    if (module.exports.recentConfessions.length === 5)
      module.exports.recentConfessions.shift();

    module.exports.recentConfessions.push(confession);
  },
  async getConfessionIdByNumber(number) {
    return (await Confession.findOne({ number }).exec()).approved_message_id
  },
  async getConfessionNumber() {
    return (await MetadataConfession.findById(confessionMetadetaId)).number
  },
  async doesReplyExist(reply) {
    if (reply === null)
      throw Error()

    const confession = await Confession.exists({ number: reply.value })
    return confession !== null
  },
  encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(
      algorithm,
      Buffer.concat([Buffer.from(ENCRYPTION_KEY, "hex"), Buffer.alloc(32)], 32),
      iv
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  },
  decrypt(text) {
    let textParts = text.split(":");
    let iv = Buffer.from(textParts.shift(), "hex");
    let encryptedText = Buffer.from(textParts.join(":"), "hex");
    let decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.concat([Buffer.from(ENCRYPTION_KEY, "hex"), Buffer.alloc(32)], 32),
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  },
};
