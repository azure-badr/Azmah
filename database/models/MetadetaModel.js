const mongoose = require("mongoose")

const MetadataConfessionSchema = mongoose.Schema(
  {
    number: {
      type: Number
    }
  }
)

module.exports = mongoose.model("MetadataConfession", MetadataConfessionSchema)