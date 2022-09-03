const mongoose = require("mongoose")
const { mongoUri } = require("../config")

const initializeDatabase = async () => {
  try {
    connection = await mongoose.connect(
      mongoUri,
      {
        dbName: "confessions"
      }
    )
    console.log(`[+] MongoDB Connected: ${connection.connection.host}`)

  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

module.exports = initializeDatabase