const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const ALLOWED_ROLE_ID = "1511776275646251059";

function parseDuration(input) {
  const regex = /^(\d+d)?\s*(\d+h)?\s*(\d+m)?\s*(\d+s)?$/i;
  const match = input.trim().match(regex);
  if (!match) return null;

  let ms = 0;
  if (match[1]) ms += parseInt(match[1]) * 24 * 60 * 60 * 1000;
  if (match[2]) ms += parseInt(match[2]) * 60 * 60 * 1000;
  if (match[3]) ms += parseInt(match[3]) * 60 * 1000;
  if (match[4]) ms += parseInt(match[4]) * 1000;

  return ms > 0 ? ms : null;
}

function formatTime(ms) {
  if (ms <= 0) return "Ended";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);

  let output = "";
  if (days > 0) output += `${days}d `;
  if (hours > 0 || days > 0) output += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) output += `${minutes}m `;
  output += `${seconds}s`;
  return output.trim();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Start a new server giveaway")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: "❌ You do not have permission to use this command.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("giveaway_creation_modal")
      .setTitle("Create a New Giveaway");

    const prizeInput = new TextInputBuilder()
      .setCustomId("giveaway_prize")
      .setLabel("What is the prize?")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. 5,000 Credits, Nitro, Custom Role")
      .setRequired(true);

    const durationInput = new TextInputBuilder()
      .setCustomId("giveaway_duration")
      .setLabel("Duration:")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. 1d, 12h, 30m, 45s")
      .setRequired(true);

    const winnersInput = new TextInputBuilder()
      .setCustomId("giveaway_winners")
      .setLabel("Number of winners:")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. 1, 3, 5")
      .setValue("1")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(prizeInput),
      new ActionRowBuilder().addComponents(durationInput),
      new ActionRowBuilder().addComponents(winnersInput),
    );

    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    if (interaction.customId !== "giveaway_creation_modal") return;

    const prize = interaction.fields.getTextInputValue("giveaway_prize");
    const durationInput =
      interaction.fields.getTextInputValue("giveaway_duration");
    const winnerCount = parseInt(
      interaction.fields.getTextInputValue("giveaway_winners"),
    );

    const durationMs = parseDuration(durationInput);

    if (!durationMs || isNaN(winnerCount) || winnerCount <= 0) {
      return interaction.reply({
        content:
          "❌ Please provide a valid duration format (e.g. 1d 2h, 30m) and a positive winner count.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const serverIcon = interaction.guild.iconURL({ dynamic: true });
    const endTime = Date.now() + durationMs;
    const entrants = new Set();

    const giveawayEmbed = new EmbedBuilder()
      .setColor("#222222")
      .setTitle("🎁 ACTIVE GIVEAWAY")
      .setDescription(`Click the button below to secure your entry spot!`)
      .addFields(
        { name: "🏆 Prize Pool", value: `\`\`\`${prize}\`\`\``, inline: false },
        { name: "👥 Target Winners", value: `${winnerCount}`, inline: true },
        { name: "🎟️ Total Entries", value: "0", inline: true },
        {
          name: "⏳ Time Remaining",
          value: `${formatTime(endTime - Date.now())}`,
          inline: false,
        },
      )
      .setFooter({ text: "Giveaway System" })
      .setTimestamp();

    if (serverIcon) giveawayEmbed.setThumbnail(serverIcon);

    const enterButton = new ButtonBuilder()
      .setCustomId(`enter_giveaway_${interaction.id}`)
      .setLabel("Enter Giveaway (0 Entries)")
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(enterButton);
    const channelMessage = await interaction.channel.send({
      embeds: [giveawayEmbed],
      components: [actionRow],
    });

    await interaction.editReply({
      content: "✅ Giveaway successfully launched!",
    });

    const collector = channelMessage.createMessageComponentCollector({
      filter: (i) => i.customId === `enter_giveaway_${interaction.id}`,
      time: durationMs,
    });

    collector.on("collect", async (i) => {
      if (entrants.has(i.user.id)) {
        entrants.delete(i.user.id);
        await i.reply({
          content: "🛑 You have left the giveaway.",
          flags: [MessageFlags.Ephemeral],
        });
      } else {
        entrants.add(i.user.id);
        await i.reply({
          content: "🎉 Your entry has been successfully recorded!",
          flags: [MessageFlags.Ephemeral],
        });
      }

      const updateEmbed = EmbedBuilder.from(channelMessage.embeds[0]);
      updateEmbed.setFields([
        { name: "🏆 Prize Pool", value: `\`\`\`${prize}\`\`\``, inline: false },
        { name: "👥 Target Winners", value: `${winnerCount}`, inline: true },
        { name: "🎟️ Total Entries", value: `${entrants.size}`, inline: true },
        {
          name: "⏳ Time Remaining",
          value: `${formatTime(endTime - Date.now())}`,
          inline: false,
        },
      ]);

      const updatedButton = ButtonBuilder.from(enterButton).setLabel(
        `Enter Giveaway (${entrants.size} Entries)`,
      );
      const updatedRow = new ActionRowBuilder().addComponents(updatedButton);

      await channelMessage.edit({
        embeds: [updateEmbed],
        components: [updatedRow],
      });
    });

    const updateInterval = setInterval(async () => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        clearInterval(updateInterval);
        return;
      }
      try {
        const activeMsg = await interaction.channel.messages.fetch(
          channelMessage.id,
        );
        const loopEmbed = EmbedBuilder.from(activeMsg.embeds[0]);
        loopEmbed.setFields([
          {
            name: "🏆 Prize Pool",
            value: `\`\`\`${prize}\`\`\``,
            inline: false,
          },
          { name: "👥 Target Winners", value: `${winnerCount}`, inline: true },
          { name: "🎟️ Total Entries", value: `${entrants.size}`, inline: true },
          {
            name: "⏳ Time Remaining",
            value: `${formatTime(remaining)}`,
            inline: false,
          },
        ]);

        const currentButton = ButtonBuilder.from(enterButton).setLabel(
          `Enter Giveaway (${entrants.size} Entries)`,
        );
        const loopRow = new ActionRowBuilder().addComponents(currentButton);

        await activeMsg.edit({ embeds: [loopEmbed], components: [loopRow] });
      } catch {}
    }, 1500);

    collector.on("end", async () => {
      clearInterval(updateInterval);
      try {
        const finalMsg = await interaction.channel.messages.fetch(
          channelMessage.id,
        );
        const entryList = Array.from(entrants);

        if (entryList.length === 0) {
          const emptyEmbed = EmbedBuilder.from(finalMsg.embeds[0])
            .setColor("#780204")
            .setTitle("🛑 GIVEAWAY ENDED")
            .setDescription("The giveaway has concluded.")
            .setFields([
              {
                name: "🏆 Prize Pool",
                value: `\`\`\`${prize}\`\`\``,
                inline: false,
              },
              {
                name: "❌ Outcome",
                value: "No valid entries were received for this event.",
                inline: false,
              },
            ]);

          await finalMsg.edit({ embeds: [emptyEmbed], components: [] });
          return interaction.channel.send(
            `❌ The giveaway for **${prize}** ended, but nobody entered.`,
          );
        }

        const winners = [];
        for (let i = 0; i < Math.min(winnerCount, entryList.length); i++) {
          const index = Math.floor(Math.random() * entryList.length);
          winners.push(`<@${entryList.splice(index, 1)[0]}>`);
        }

        const endedEmbed = EmbedBuilder.from(finalMsg.embeds[0])
          .setColor("#111212")
          .setTitle("🏆 GIVEAWAY ENDED")
          .setDescription("The giveaway has officially concluded!")
          .setFields([
            {
              name: "🏆 Prize Pool",
              value: `\`\`\`${prize}\`\`\``,
              inline: false,
            },
            {
              name: "🎉 Lucky Winners",
              value: winners.join(", "),
              inline: false,
            },
          ]);

        await finalMsg.edit({ embeds: [endedEmbed], components: [] });
        await interaction.channel.send(
          `🎉 Congratulations to ${winners.join(", ")}! You won the giveaway for **${prize}**!`,
        );
      } catch (err) {
        console.error(err);
      }
    });
  },
};
