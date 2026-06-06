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
    .setDescription(
      "Broadcast a plain message or styled embed to the current channel",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    // 1. Toggle Embed
    .addBooleanOption((option) =>
      option
        .setName("use_embed")
        .setDescription(
          "Wrap the message inside a styled Embed box? (True/False)",
        )
        .setRequired(true),
    )
    // 2. Main Text Content
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("The main body text (Use \\n for a new line break)")
        .setRequired(true),
    )
    // 3. Preset Color Palette
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription(
          "Pick a background strip color (Ignored if use_embed is False)",
        )
        .setRequired(false)
        .addChoices(
          { name: "⚫ Charcoal (Default)", value: "#1E1F22" },
          { name: "🔴 Red", value: "#F23F43" },
          { name: "🟢 Green", value: "#23A55A" },
          { name: "🔵 Blue", value: "#5865F2" },
          { name: "🟡 Yellow", value: "#FEE75C" },
          { name: "🟠 Orange", value: "#E67E22" },
          { name: "🟣 Purple", value: "#9B59B6" },
          { name: "💖 Pink", value: "#E91E63" },
          { name: "🎨 Custom Hex Code", value: "CUSTOM" },
        ),
    )
    // 4. Embed Title
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Main header title for the Embed")
        .setRequired(false),
    )
    // 5. Public Pings
    .addStringOption((option) =>
      option
        .setName("mention")
        .setDescription("Ping a global role alongside this announcement?")
        .setRequired(false)
        .addChoices(
          { name: "@everyone", value: "@everyone" },
          { name: "@here", value: "@here" },
        ),
    )
    // 6. Manual Custom Hex Input
    .addStringOption((option) =>
      option
        .setName("custom_hex")
        .setDescription(
          "If you selected Custom Hex, type the raw code here (e.g., FF00FF)",
        )
        .setRequired(false),
    )
    // 7. Small Top-Right Icon
    .addStringOption((option) =>
      option
        .setName("thumbnail")
        .setDescription(
          "Direct link (URL) to a small thumbnail image in the top-right corner",
        )
        .setRequired(false),
    )
    // 8. Large Main Banner
    .addStringOption((option) =>
      option
        .setName("image")
        .setDescription(
          "Direct link (URL) to a large banner image at the bottom of the embed",
        )
        .setRequired(false),
    )
    // 9. Tiny Footer Caption
    .addStringOption((option) =>
      option
        .setName("footer")
        .setDescription("Small text caption to display at the very bottom edge")
        .setRequired(false),
    ),

  async execute(interaction) {
    const { member, options, channel } = interaction;

    // Direct role gate lockout
    if (!member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: "❌ You are not authorized to use this management tool.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    // Extract option configurations safely
    const useEmbed = options.getBoolean("use_embed");
    const descriptionText = options
      .getString("description")
      .replace(/\\n/g, "\n");
    const titleText = options.getString("title");
    const mention = options.getString("mention");
    const chosenColor = options.getString("color") || "#1E1F22";
    const customHex = options.getString("custom_hex");
    const thumbnailLink = options.getString("thumbnail");
    const imageLink = options.getString("image");
    const footerText = options.getString("footer");

    // Acknowledge response instantly so the interaction token never hits the 3-second limit timeout
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const messagePayload = {};

      // Handle raw ping distribution lines
      if (mention) {
        messagePayload.content = mention;
      }

      // ------------------------------------------
      // ROUTE A: EMBED STRUCTURING
      // ------------------------------------------
      if (useEmbed) {
        const embed = new EmbedBuilder().setDescription(descriptionText);

        if (titleText) embed.setTitle(titleText);

        // Smart color evaluations
        if (chosenColor === "CUSTOM" && customHex) {
          let cleanHex = customHex.trim();
          if (!cleanHex.startsWith("#")) cleanHex = `#${cleanHex}`;

          if (/^#[0-9A-F]{6}$/i.test(cleanHex)) {
            embed.setColor(cleanHex);
          } else {
            embed.setColor("#1E1F22");
          }
        } else {
          embed.setColor(chosenColor === "CUSTOM" ? "#1E1F22" : chosenColor);
        }

        // Secure URL verification blocks for image injection
        const urlRegex = /^https?:\/\//i;
        if (thumbnailLink && urlRegex.test(thumbnailLink)) {
          embed.setThumbnail(thumbnailLink);
        }
        if (imageLink && urlRegex.test(imageLink)) {
          embed.setImage(imageLink);
        }

        if (footerText) {
          embed.setFooter({ text: footerText });
        }

        messagePayload.embeds = [embed];
      }
      // ------------------------------------------
      // ROUTE B: CLEAN PLAIN-TEXT OUTLET
      // ------------------------------------------
      else {
        if (messagePayload.content) {
          messagePayload.content = `${messagePayload.content}\n${descriptionText}`;
        } else {
          messagePayload.content = descriptionText;
        }
      }

      // Deploy the final broadcast payload to the channel UI
      await channel.send(messagePayload);

      return await interaction.editReply({
        content: "✅ Announcement has been safely transmitted!",
      });
    } catch (error) {
      console.error("Error executing advanced say command:", error);
      return await interaction.editReply({
        content:
          "❌ Failed to send announcement. Please verify your asset links are formatting properly.",
      });
    }
  },
};
