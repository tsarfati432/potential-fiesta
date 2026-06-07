const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const ALLOWED_ROLE_ID = "1511776275646251059";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invites-modal")
    .setDescription("Deploy the invite link retrieval system")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: "❌ No permission.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#1E1F22")
      .setTitle("🔗 Get Your Personal Invite Link")
      .setDescription(
        "Click the button below to retrieve your personal trackable invite link.",
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("receive_invite_btn")
        .setLabel("Receive Invite")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔗"),
    );

    await interaction.reply({
      content: "✅ Deployed.",
      flags: [MessageFlags.Ephemeral],
    });

    await interaction.channel.send({ embeds: [embed], components: [row] });
  },

  async handleButton(interaction) {
    const { customId, guild, member } = interaction;

    if (customId === "receive_invite_btn") {
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      try {
        // Fetch all active invites on the server directly from Discord
        const allInvites = await guild.invites.fetch();

        // Look for a link where the creator matches the user who clicked
        const userInvite = allInvites.find(
          (inv) => inv.inviter && inv.inviter.id === member.id,
        );

        // If they have one, give it to them
        if (userInvite) {
          return interaction.editReply({
            content: `🔗 **Your personal invite link (Created by you):**\n${userInvite.url}`,
          });
        }

        // If they don't have one, tell them to make it so the other bot tracks them properly
        return interaction.editReply({
          content:
            "❌ **You haven't created a personal invite link yet!**\n\n" +
            "To make sure your invites count under your name on the tracking bot, you need to create one manually:\n" +
            "1. Click the invite button next to any text channel.\n" +
            "2. Edit the link settings so it **Never Expires**.\n" +
            "3. Generate the link, then come back and click this button anytime to copy it!",
        });
      } catch (error) {
        console.error(error);
        return interaction.editReply({
          content: "❌ Error fetching invite data. Check bot permissions.",
        });
      }
    }
  },
};
