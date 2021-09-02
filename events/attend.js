const {
  approveEmoji,
  rejectEmoji,
  confessionsChannelId,
} = require("../config.json");
const { MessageActionRow, MessageButton } = require("discord.js");

const {
  getConfessionNumber,
  getConfessionQueue,
  updateConfessionNumber,
  addConfession,
  popFromConfessionQueue,
} = require("../utils/config.js");

function addConfessionAndUpdate(confessionInQueue, confessionNumber) {
  addConfession(confessionInQueue);
  updateConfessionNumber(confessionNumber);
}

let confessionNumber = getConfessionNumber();

const messageIds = new Map();

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    // If button was already pressed
    if (messageIds.get(interaction.message.id)) {
      interaction.reply({ content: "This confession has already been replied to", ephemeral: true });
      return;
    }

    // If confession doesn't exist in the confession queue
    let confessionInQueue = getConfessionQueue().find(confession => confession.confessionsApprovalMessageId === interaction.message.id);
    if (!confessionInQueue) {
      interaction.reply({ content: "This confession is not in the queue anymore", ephemeral: true });
      return;
    }

    messageIds.set(interaction.message.id, true);

    const confessionApproved = interaction.component.customId === "approved";
    let replyValue = "confessionRequestReplyTo" in confessionInQueue ? confessionInQueue.confessionRequestReplyTo : undefined;

    if (confessionApproved) {
      const confessionsChannel = interaction.guild.channels.cache.get(confessionsChannelId);
      const confessionMessage = {
        content: `${interaction.message.content}`,
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setCustomId((confessionNumber++).toString())
              .setLabel(`Confession ${confessionNumber}`)
              .setStyle("SECONDARY")
              .setDisabled()
          ),
        ],
      }

      // Check if the confession is a reply
      let sentConfessionMessage;
      if (replyValue) {
        // TODO there is a better way to assign keys to the confessionInQueue
        confessionsChannel.messages.fetch(confessionInQueue.confessionRequestReplyMessageId)
          .then(async message => {
            sentConfessionMessage = await message.reply(confessionMessage);

            confessionInQueue = {
              confessionNumber,
              confessorId: confessionInQueue.confessionRequestAuthorId,
              confessorName: confessionInQueue.confessionRequestAuthorName,
              confessionMessageId: confessionInQueue.confessionMessageId,
              confessionMessageContent: confessionInQueue.confessionRequestMessageContent,
              confessionPostedMessageUrl: sentConfessionMessage.url,
              confessionPostedMessageId: sentConfessionMessage.id,
              confessionApprovedBy: interaction.user.username,
              confessionReplyTo: replyValue
            };

            addConfessionAndUpdate(confessionInQueue, confessionNumber);
          });
      } else {
        sentConfessionMessage = await confessionsChannel.send(confessionMessage);

        confessionInQueue = {
          confessionNumber,
          confessorId: confessionInQueue.confessionRequestAuthorId,
          confessorName: confessionInQueue.confessionRequestAuthorName,
          confessionMessageId: confessionInQueue.confessionMessageId,
          confessionMessageContent: confessionInQueue.confessionRequestMessageContent,
          confessionPostedMessageUrl: sentConfessionMessage.url,
          confessionPostedMessageId: sentConfessionMessage.id,
          confessionApprovedBy: interaction.user.username,
        };

        addConfessionAndUpdate(confessionInQueue, confessionNumber);
      }
    }

    // Update button according to how it was attended
    interaction.update({
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId(
              confessionApproved
                ? `approvedBy${interaction.user.id}`
                : `rejectedBy${interaction.user.id}`
            )
            .setLabel(
              `${confessionApproved
                ? "Confession approved"
                : "Confession rejected"
              } by ${interaction.user.username}`
            )
            .setStyle(confessionApproved ? "SUCCESS" : "DANGER")
            .setEmoji(confessionApproved ? approveEmoji : rejectEmoji)
            .setDisabled()
        ),
      ],
    });

    // Remove the indication for the button already clicked and remove confession from confession queue
    messageIds.delete(interaction.message.id);
    popFromConfessionQueue(interaction.message.id);
  },
};
