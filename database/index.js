const mongoose = require("mongoose")
const { mongoUri } = require("../config")
const MetadetaModel = require("./models/MetadetaModel")

const initializeDatabase = async () => {
  try {
    connection = await mongoose.connect(
      mongoUri,
      {
        dbName: "confessions"
      }
    )
    await MetadetaModel.create({ number: 30131 })
    console.log(`[+] MongoDB Connected: ${connection.connection.host}`)

  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

module.exports = initializeDatabase