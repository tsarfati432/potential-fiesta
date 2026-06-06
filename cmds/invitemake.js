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
    // Strict admin/staff role check to deploy the panel
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content:
          "❌ You do not have permission to deploy this administration panel.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#1E1F22")
      .setTitle("🔗 Personal Invite Generator")
      .setDescription(
        "Welcome to the server access panel.\n\nClick the button below to generate your own unique, trackable invite link instantly.",
      )
      .addFields({
        name: "System Status",
        value: "`Operational`",
        inline: true,
      })
      .setFooter({ text: "0xSpammer • Internal Tools" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("receive_invite_btn")
        .setLabel("Receive Invite")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔗"),
    );

    await interaction.reply({
      content: "✅ Invite retrieval panel successfully deployed!",
      flags: [MessageFlags.Ephemeral],
    });

    await interaction.channel.send({ embeds: [embed], components: [row] });
  },

  async handleButton(interaction) {
    const { customId, guild, member, channel } = interaction;

    if (customId === "receive_invite_btn") {
      // Defer right away so it never expires during generation lag
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      try {
        // We drop the broken find loop and generate a brand NEW user-bound link every time
        const userInvite = await channel.createInvite({
          maxAge: 0, // Never expires
          maxUses: 0, // Infinite uses
          unique: true, // CRITICAL: Binds this link directly to the clicking user's account for tracking
          reason: `Trackable invite generated via panel button by: ${interaction.user.tag}`,
        });

        if (!userInvite) {
          return interaction.editReply({
            content:
              "❌ Failed to establish an invite stream. Check channel configuration.",
          });
        }

        // Return the clean URL directly to them ephemerally
        return interaction.editReply({
          content: `🔗 **Here is your personal invite link:**\n${userInvite.url}\n\n*This link is tied to your account profile for invite statistics.*`,
        });
      } catch (error) {
        console.error("Invite Panel Button Error:", error);
        return interaction.editReply({
          content:
            "❌ An internal API error occurred while generating your link. Verify bot permissions.",
        });
      }
    }
  },
};
