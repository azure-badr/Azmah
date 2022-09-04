const Confession = require("../database/models/ConfessionModel")
const MetadataConfession = require("../database/models/MetadetaModel")

const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

const crypto = require("crypto");
const fetch = require("cross-fetch");

const algorithm = "aes-256-ctr";
const ENCRYPTION_KEY = process.env.CONFESSION_ENCRYPTION_PASSWORD;
const IV_LENGTH = 16;

const { tatsuApiKey, tatsuApiUrl, tatsuRequiredScore, confessionMetadetaId } = require("../config.js");

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
  async addConfession(confession) {
    await Confession.create(confession)
  },
  async getConfession(filter) {
    return (await Confession.findOne(filter))
  },
  async rejectConfession(interaction) {
    await interaction.update({
      components:
        [new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`rjtd-by-${interaction.user.username}`)
            .setLabel(`Rejected by ${interaction.user.username}`)
            .setStyle("Danger")
            .setDisabled()
        )]
    })

    await Confession.findOneAndUpdate(
      { approval_message_id: interaction.message.id },
      { rejected_by: interaction.user.id }
    )
  },
  async approveConfession(interaction, confession) {
    await Confession.findOneAndUpdate(
      { approval_message_id: interaction.message.id },
      confession
    )
  },
  async getConfessionIdByNumber(number) {
    return (await Confession.findOne({ number }).exec()).approved_message_id
  },
  async getConfessionNumber() {
    return (await MetadataConfession.findById(confessionMetadetaId)).number
  },
  async incrementConfessionNumber() {
    await MetadataConfession.findByIdAndUpdate(
      confessionMetadetaId, { $inc: { number: 1 } }
    )
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
