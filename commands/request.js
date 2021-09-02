const { SlashCommandBuilder } = require("@discordjs/builders");
const { Formatters } = require("discord.js");
const { getConfessionByNumber, getConfessionByMessageId } = require("../utils/config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("request")
        .setDescription("Request confession data by its number or message ID")
        .setDefaultPermission(false)
        .addStringOption(option =>
            option.setName("number")
                .setDescription("Get confession data by its number")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("messageid")
                .setDescription("Get confession data by its message ID")
                .setRequired(false)
        ),
    async execute(interaction) {
        if (interaction.options.get("number")?.value && interaction.options.get("messageid")?.value) {
            interaction.reply({ content: "You can only specify one option at a time!", ephemeral: true });
            return;
        }

        if (interaction.options.get("number")?.value) {
            const confession = getConfessionByNumber(Number(interaction.options.get("number").value));
            if (!confession) {
                interaction.reply({
                    content: "A confession with this number does not exist",
                    ephemeral: true
                });
                return;
            }

            interaction.reply({
                content:
                    Formatters.codeBlock("javascript", JSON.stringify(confession, null, 4))
            });
            return;
        }
        
        if (interaction.options.get("messageid")?.value) {
            const confession = getConfessionByMessageId(interaction.options.get("messageid").value);
            if (!confession) {
                interaction.reply({
                    content: "A confession with this message ID does not exist",
                    ephemeral: true
                });
                return;
            }

            interaction.reply({
                content:
                    Formatters.codeBlock("javascript", JSON.stringify(confession, null, 4))
            });
            return;
        }
    }
}
