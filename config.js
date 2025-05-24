const dotenv = require("dotenv")
dotenv.config()

module.exports = {
  "token": process.env.TOKEN,
  "tatsuApiKey": process.env.TATSU_API_KEY,
  "tatsuApiUrl": process.env.TATSU_API_URL,
  "tatsuRequiredScore": process.env.TATSU_REQUIRED_SCORE,
  "clientId": process.env.CLIENT_ID,
  "guildId": process.env.GUILD_ID,
  "confessionsApprovalChannelId": process.env.CONFESSIONS_APPROVAL_CHANNEL_ID,
  "confessionsChannelId": process.env.CONFESSIONS_CHANNEL_ID,
  "mongoUri": process.env.MONGO_URI,
  "confessionMetadetaId": process.env.CONFESSION_METADETA_ID,
  "approveEmoji": "881813025642909726",
  "rejectEmoji": "881813465835130880",
  "messageReplyNumberLimit": process.env.CONFESSION_MESSAGE_REPLY_LIMIT || 30132,
  "modRoleId": process.env.MOD_ROLE_ID,
  "ownerRoleId": process.env.OWNER_ROLE_ID,
  "environment": process.env.ENVIRONMENT,
  "botOwnerId": process.env.BOT_OWNER_ID,
}
