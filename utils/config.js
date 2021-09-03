const fs = require("fs");
const crypto = require("crypto");

const algorithm = "";
const ENCRYPTION_KEY = process.env.CONFESSION_ENCRYPTION_PASSWORD;
const IV_LENGTH = 16;
const CONFESSIONS_FILE_PATH = `${require("path").resolve(__dirname, "../confessions/")}`;

const { tatsuApiKey, tatsuApiUrl } = require("../config.json");

let confessionQueue = [];

module.exports = {
  
  async hasSufficientPoints(guildId, userId) {
    const userPointsEndpoint = `guilds/${guildId}/rankings/members/${userId}/all`;
    const options = {
      hostname: ""
    }
    const response = await fetch(`${tatsuApiUrl}${userPointsEndpoint}`, {
      headers: {
        "Content-Type": "application/json",
        "authorization": `${tatsuApiKey}`
      }
    });

    return await response.json();
  },

  getConfessionQueue() {
    return confessionQueue
  },

  pushToConfessionQueue(confessionRequestObject) {
    confessionQueue.push(confessionRequestObject);
  },

  popFromConfessionQueue(confessionId) {
    confessionQueue = confessionQueue.filter(
      queuedConfession =>
        queuedConfession.confessionsApprovalMessageId !== confessionId
    );
  },

  addConfessionRequest(confessionRequestObject) {
    const confessionApprovalsJSON = fs.readFileSync(`${CONFESSIONS_FILE_PATH}/requests.json`, "utf-8");

    const confessionApprovals = JSON.parse(confessionApprovalsJSON);
    confessionApprovals.push(confessionRequestObject);

    fs.writeFileSync(`${CONFESSIONS_FILE_PATH}/requests.json`, JSON.stringify(confessionApprovals, null, 4), "utf-8");


  },

  addConfession(confessionObject) {
    const confessionsJSON = fs.readFileSync(`${CONFESSIONS_FILE_PATH}/confessions.json`, "utf-8");

    const confessions = JSON.parse(confessionsJSON);
    confessions.push(confessionObject);

    fs.writeFileSync(`${CONFESSIONS_FILE_PATH}/confessions.json`, JSON.stringify(confessions, null, 4), "utf-8");
    confessionQueue = confessionQueue.filter(confession => confession.confessionMessageId === confessionObject.confessionMessageId);
  },

  updateConfessionNumber(confessionNumber) {
    fs.writeFile(
      "number.json",
      JSON.stringify({ confessionNumber }, null, 4),
      (error) => {
        if (error)
          console.log(
            `Error at config.js while updating confession number: ${error}`
          );
      }
    );
  },

  getConfessionNumber() {
    return JSON.parse(fs.readFileSync("number.json"))["confessionNumber"];
  },

  getConfessionByNumber(number) {
    const confessions = JSON.parse(fs.readFileSync(`${CONFESSIONS_FILE_PATH}/confessions.json`, "utf-8"));
    const confession = confessions.find(confession => confession.confessionNumber === number);

    return confession;
  },

  getConfessionByMessageId(id) {
    const confessionRequests = JSON.parse(fs.readFileSync(`${CONFESSIONS_FILE_PATH}/requests.json`, "utf-8"));
    const confessionRequest = confessionRequests.find(confession => confession.confessionsApprovalMessageId === id);

    return confessionRequest;
  },

  getConfessionByConfessionId(confessionNumber) {
    const confessions = JSON.parse(fs.readFileSync(`${CONFESSIONS_FILE_PATH}/confessions.json`, "utf-8"));
    const foundConfession = confessions.find(confession => confession.confessionNumber === confessionNumber);
    return  foundConfession ? {
      id: foundConfession.confessionPostedMessageId,
      url: foundConfession.confessionPostedMessageUrl,
    } : null
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
