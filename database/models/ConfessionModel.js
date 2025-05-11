const mongoose = require("mongoose")

const ConfessionSchema = mongoose.Schema(
  {
    // This is the confession number
    number: {
      type: Number,
      required: false,
    },
    // This is the ID of the confessor
    confessor_id: {
      type: String,
      required: true,
    },
    // Name of the confessor
    confessor_name: {
      type: String,
      required: true,
    },
    // This is the message ID of the confession (the message of the confessor posted in azmah's DM)
    message_id: {
      type: String,
      required: true,
      unique: true,
    },
    // This is the message ID of the confession in #confessions-approval
    approval_message_id: {
      type: String,
      required: false,
    },
    // This is the message ID of the confession posted in #confessions
    approved_message_id: {
      type: String,
      required: false,
    },
    approved_message_url: {
      type: String,
      required: false,
    },
    // This is the author ID of the mod who approved the confession
    approved_by: {
      type: String,
      required: false,
    },
    // This value represents whether the confession was approved or not
    approved: {
      type: Boolean,
      default: false
    },
    rejected_by: {
      type: String,
      required: false,
    },
  }
)

module.exports = mongoose.model("Confession", ConfessionSchema)