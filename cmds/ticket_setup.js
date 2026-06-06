const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  AttachmentBuilder,
} = require("discord.js");

const TRANSCRIPT_CHANNEL_ID = "1512055497002582056";
const TICKET_CATEGORY_ID = "1511800165118247063";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket_setup")
    .setDescription("Spawns the advanced ticket creation system dashboard")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#1E1F22")
      .setTitle("0xSpammer - Ticket Panel")
      .setDescription(
        "Please select the category below that best matches your request to open a secure ticket.",
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }));

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_category_select")
      .setPlaceholder("Choose a ticket category...")
      .addOptions([
        {
          label: "Buying",
          description: "Open a ticket to purchase products or services",
          value: "buying_ticket",
          emoji: "🛒",
        },
        {
          label: "General Question",
          description: "Open a ticket for general inquiries or support",
          value: "general_ticket",
          emoji: "❓",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: "✅ Ticket system dashboard deployed!",
      flags: [MessageFlags.Ephemeral],
    });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  },

  async handleMenu(interaction) {
    if (interaction.customId !== "ticket_category_select") return;

    const { guild, member, values } = interaction;
    const staffRoleId = "1511776345343000747";
    const chosenCategory = values[0];

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const usernameLower = member.user.username.toLowerCase();
    const existingTicket = guild.channels.cache.find(
      (ch) =>
        ch.type === ChannelType.GuildText &&
        (ch.name === `buy-${usernameLower}` ||
          ch.name === `gen-${usernameLower}`),
    );

    if (existingTicket) {
      return interaction.editReply({
        content: `❌ You already have an active support ticket open: ${existingTicket}`,
      });
    }

    try {
      let prefix = chosenCategory === "buying_ticket" ? "buy" : "gen";
      const ticketChannelName = `${prefix}-${usernameLower}`;

      const ticketChannel = await guild.channels.create({
        name: ticketChannelName,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: staffRoleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      const displayCategory =
        chosenCategory === "buying_ticket"
          ? "🛒 Buying"
          : "❓ General Question";

      const infoEmbed = new EmbedBuilder()
        .setColor("#1E1F22")
        .setTitle("🔒 Private Support Ticket")
        .setDescription(
          `Welcome ${member.user}!\n\nPlease describe your request in detail. A staff member will assist you shortly.`,
        )
        .addFields(
          { name: "👤 Creator", value: `${member.user}`, inline: true },
          {
            name: "📂 Category",
            value: `\`${displayCategory}\``,
            inline: true,
          },
          { name: "📌 Status", value: "`Waiting for Staff...`", inline: true },
        );

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("claim_ticket_btn")
          .setLabel("Claim Ticket")
          .setStyle(ButtonStyle.Success)
          .setEmoji("📌"),
        new ButtonBuilder()
          .setCustomId("close_ticket_btn")
          .setLabel("Close")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒"),
      );

      await ticketChannel.send({
        content: `<@&${staffRoleId}>`,
        embeds: [infoEmbed],
        components: [actionRow],
      });

      return interaction.editReply({
        content: `✅ Ticket created successfully! Go to ${ticketChannel}`,
      });
    } catch (error) {
      console.error(error);
      return interaction.editReply({
        content:
          "❌ Failed to create your ticket channel. Check bot permissions.",
      });
    }
  },

  async handleButton(interaction) {
    const { customId, guild, member, message } = interaction;
    const staffRoleId = "1511776345343000747";

    const targetChannel = guild.channels.cache.get(interaction.channelId);
    if (!targetChannel) return;

    if (customId === "claim_ticket_btn") {
      if (!member.roles.cache.has(staffRoleId)) {
        return interaction.reply({
          content: "❌ Only support staff can claim tickets.",
          flags: [MessageFlags.Ephemeral],
        });
      }

      const receivedEmbed = message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(receivedEmbed)
        .setColor("#23A55A")
        .spliceFields(2, 1, {
          name: "📌 Status",
          value: `\`Claimed by ${member.user.username}\``,
          inline: true,
        });

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("claim_ticket_btn")
          .setLabel("Claimed")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
          .setEmoji("✅"),
        new ButtonBuilder()
          .setCustomId("close_ticket_btn")
          .setLabel("Close")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒"),
      );

      try {
        await targetChannel.permissionOverwrites.edit(staffRoleId, {
          ViewChannel: true,
          SendMessages: false,
        });
        await targetChannel.permissionOverwrites.edit(member.id, {
          ViewChannel: true,
          SendMessages: true,
        });

        await interaction.update({
          embeds: [updatedEmbed],
          components: [updatedRow],
        });
        return interaction.followUp({
          content: `📌 ${member.user} has claimed this ticket.`,
        });
      } catch (error) {
        console.error(error);
      }
    }

    if (customId === "close_ticket_btn") {
      await interaction.deferReply();

      const parts = targetChannel.name.split("-");
      const topicUserId = parts.slice(1).join("-");
      const targetMember = guild.members.cache.find(
        (m) => m.user.username.toLowerCase() === topicUserId,
      );

      if (targetMember) {
        try {
          await targetChannel.permissionOverwrites.edit(targetMember.id, {
            ViewChannel: false,
          });
        } catch (error) {
          console.error("Could not hide channel from user:", error);
        }
      }

      const staffControlEmbed = new EmbedBuilder()
        .setColor("#F23F43")
        .setTitle("🛠️ Staff Control Panel")
        .setDescription(
          "The ticket creator has been removed from this channel.\n\nReview transcripts or sync logs, then click below to permanently clear the layout.",
        );

      const deleteRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("delete_ticket_btn")
          .setLabel("Delete Ticket")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️"),
      );

      await message.delete().catch(() => {});
      return interaction.editReply({
        content: "🔒 **Ticket Closed.** Creator permissions revoked.",
        embeds: [staffControlEmbed],
        components: [deleteRow],
      });
    }

    if (customId === "delete_ticket_btn") {
      if (!member.roles.cache.has(staffRoleId)) {
        return interaction.reply({
          content:
            "❌ Only support staff can permanently delete closed tickets.",
          flags: [MessageFlags.Ephemeral],
        });
      }

      const targetChannelId = interaction.channelId;
      const cachedChannelName = targetChannel.name;

      await interaction.reply({
        content:
          "⚠️ **Compiling transcript and deleting channel permanently in 5 seconds...**",
      });

      try {
        const fetchedMessages = await targetChannel.messages.fetch({
          limit: 100,
        });
        let transcriptText = `--- TICKET TRANSCRIPT LOG: #${cachedChannelName} ---\n`;
        transcriptText += `Deleted By: ${member.user.tag} (${member.id})\n`;
        transcriptText += `Date: ${new Date().toUTCString()}\n`;
        transcriptText += `==================================================\n\n`;

        const logMessages = Array.from(fetchedMessages.values()).reverse();
        logMessages.forEach((msg) => {
          const time = msg.createdAt.toUTCString();
          transcriptText += `[${time}] ${msg.author.tag}: ${msg.content}\n`;
          if (msg.attachments.size > 0) {
            msg.attachments.forEach((att) => {
              transcriptText += ` -> Attachment: ${att.url}\n`;
            });
          }
        });

        const bomPrefix = "\uFEFF";
        const buffer = Buffer.from(bomPrefix + transcriptText, "utf-8");
        const fileAttachment = new AttachmentBuilder(buffer, {
          name: `${cachedChannelName}-transcript.txt`,
        });

        const transcriptLogChannel = guild.channels.cache.get(
          TRANSCRIPT_CHANNEL_ID,
        );
        if (transcriptLogChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor("#2B2D31")
            .setTitle("📁 Ticket Transcript Logged")
            .setDescription(
              `**Channel Name:** \`${cachedChannelName}\`\n**Closed By:** ${member.user}`,
            )
            .setTimestamp();

          await transcriptLogChannel.send({
            embeds: [logEmbed],
            files: [fileAttachment],
          });
        }
      } catch (err) {
        console.error("Transcript Compile Error:", err);
      }

      setTimeout(async () => {
        try {
          const channelToDelete = guild.channels.cache.get(targetChannelId);
          if (channelToDelete) {
            await channelToDelete.delete();
          }
        } catch (error) {
          console.error("Failed to delete channel cleanly:", error);
        }
      }, 5000);
    }
  },
};
