const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const ALLOWED_ROLE_ID = "1511776275646251059";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Broadcast a custom message or styled embed to the channel")
    // Fallback permission so regular members can't even see the command in their slash list
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addBooleanOption((option) =>
      option
        .setName("use_embed")
        .setDescription(
          "Should this announcement be wrapped inside an embed? (True/False)",
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("The main message text or embed description content")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription(
          "The title of the embed (Ignored if use_embed is False)",
        )
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription(
          "Hex code color for the embed side strip (e.g., #FF0000) (Ignored if False)",
        )
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("thumbnail")
        .setDescription(
          "Direct URL image link to display as a top-right thumbnail (Ignored if False)",
        )
        .setRequired(false),
    ),

  async execute(interaction) {
    const { member, options, channel } = interaction;

    // 1. Strict Role Check: Block anyone who does not hold the explicit role ID
    if (!member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: "❌ אינך מורשה להשתמש בפקודה זו. חסר לך תפקיד מתאים.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    // Extract options data passed by the staff member
    const useEmbed = options.getBoolean("use_embed");
    const descriptionText = options.getString("description");
    const titleText = options.getString("title");
    const hexColor = options.getString("color") || "#1E1F22"; // Defaults to dark grey
    const thumbnailLink = options.getString("thumbnail");

    // Immediately reply ephemerally to satisfy Discord's interaction speed requirement
    await interaction.reply({
      content: "⏳ שולח את ההודעה...",
      flags: [MessageFlags.Ephemeral],
    });

    try {
      // 2. EMBED ROUTE
      if (useEmbed) {
        const embed = new EmbedBuilder().setDescription(
          descriptionText.replace(/\\n/g, "\n"),
        ); // Supports \n lines inside the box

        if (titleText) embed.setTitle(titleText);

        // Handle hex color formatting safely
        if (hexColor.startsWith("#")) {
          embed.setColor(hexColor);
        } else if (/^[0-9A-F]{6}$/i.test(hexColor)) {
          embed.setColor(`#${hexColor}`);
        } else {
          embed.setColor("#1E1F22");
        }

        if (
          thumbnailLink &&
          (thumbnailLink.startsWith("http://") ||
            thumbnailLink.startsWith("https://"))
        ) {
          embed.setThumbnail(thumbnailLink);
        }

        await channel.send({ embeds: [embed] });
      }
      // 3. REGULAR TEXT ROUTE
      else {
        // Formats raw text inputs safely and allows clean custom line spacing
        await channel.send({ content: descriptionText.replace(/\\n/g, "\n") });
      }

      // Update the private ephemeral text confirming it went through
      return await interaction.editReply({
        content: "✅ ההודעה נשלחה בהצלחה בערוץ הנוכחי!",
      });
    } catch (error) {
      console.error("Error running say command:", error);
      return await interaction.editReply({
        content:
          "❌ אירעה שגיאה בשליחת ההודעה. ודא שהקישורים או קוד הצבע תקינים.",
      });
    }
  },
};
