const { environment } = require("../config");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}, ${client.user.id}`);
    console.log(`Running in environment: ${environment}`)
  },
};
