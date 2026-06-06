const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const ALLOWED_ROLE_ID = "1511776345343000747";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Bulk delete messages from the channel")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to clear (1-100)")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: "❌ You do not have permission to use this command.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const amount = interaction.options.getInteger("amount");

    if (amount < 1 || amount > 100) {
      return interaction.editReply({
        content: "❌ You can only delete between 1 and 100 messages at a time.",
      });
    }

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);

      return interaction.editReply({
        content: `✅ Successfully cleared \`${deleted.size}\` messages from this channel.`,
      });
    } catch (error) {
      console.error("Bulk delete failure:", error);
      return interaction.editReply({
        content:
          "❌ An error occurred while trying to clear messages in this channel. (Messages older than 14 days cannot be bulk deleted)",
      });
    }
  },
};