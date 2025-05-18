const mongoose = require("mongoose")
const { mongoUri, environment } = require("../config")

const initializeDatabase = async () => {
  try {
    connection = await mongoose.connect(
      mongoUri,
      {
        dbName: environment == "PRODUCTION" ? "confessions" : "confessions_dev"
      }
    )
    console.log(`[+] MongoDB Connected: ${connection.connection.host}`)

  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

module.exports = initializeDatabase