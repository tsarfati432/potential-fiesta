const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

module.exports = {
  async handleMessage(message) {
    if (message.content !== "!verify_setup") return;

    const allowedRoleId = "1511776901553717448";

    if (!message.member.roles.cache.has(allowedRoleId)) {
      return message.reply({
        content: "❌ You do not have permission to use this command.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#1E1F22")
      .setTitle(" Server Verification")
      .setDescription(
        "Click the button below to verify your account and gain access to the rest of the server.",
      )
      .setThumbnail(message.guild.iconURL({ dynamic: true }));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify_user_button")
        .setLabel("Verify")
        .setStyle(ButtonStyle.Success),
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  },

  async handleButton(interaction) {
    if (interaction.customId !== "verify_user_button") return;

    const verifiedRoleId = "1511776530865586198";
    const role = interaction.guild.roles.cache.get(verifiedRoleId);

    if (!role) {
      return interaction.reply({
        content: "❌ Verified role not found. Please contact an administrator.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (interaction.member.roles.cache.has(verifiedRoleId)) {
      return interaction.reply({
        content: "ℹ️ You are already verified!",
        flags: [MessageFlags.Ephemeral],
      });
    }

    try {
      await interaction.member.roles.add(role);
      await interaction.reply({
        content: "✅ You have been successfully verified!",
        flags: [MessageFlags.Ephemeral],
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "❌ Failed to assign role. Make sure my bot role is higher than the verified role!",
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
