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
        content: "❌ אין לך הרשאה מספקת לביצוע פקודה זו.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#1E1F22")
      .setTitle("מערכת קבלת קישורי הזמנה")
      .setDescription(
        "ברוכים הבאים לפאנל הגישה של השרת.\n\n" +
          "לחצו על הכפתור מטה כדי לקבל את קישור ההזמנה הפעיל והאישי שלכם ישירות מהמערכת.",
      )
      .addFields({ name: "סטטוס", value: "`פעיל`", inline: true })
      .setFooter({ text: "0xSpammer • Internal Tools" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("receive_invite_btn")
        .setLabel("Receive it")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔗"),
    );

    await interaction.reply({
      content: "✅ הפאנל נפרס בהצלחה בערוץ.",
      flags: [MessageFlags.Ephemeral],
    });

    await interaction.channel.send({ embeds: [embed], components: [row] });
  },

  async handleButton(interaction) {
    const { customId, guild, member } = interaction;

    if (customId === "receive_invite_btn") {
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      try {
        const invites = await guild.invites.fetch();
        let userInvite = invites.find(
          (inv) => inv.inviter && inv.inviter.id === member.id,
        );

        if (!userInvite) {
          const targetChannel = guild.channels.cache.get(interaction.channelId);
          if (targetChannel) {
            userInvite = await targetChannel.createInvite({
              maxAge: 0,
              maxUses: 0,
              unique: true,
              reason: `Invite generated via panel by ${interaction.user.tag}`,
            });
          }
        }

        if (!userInvite) {
          return interaction.editReply({
            content:
              "❌ לא נמצא קישור קיים ולא ניתן היה ליצור קישור חדש בערוץ זה.",
          });
        }

        return interaction.editReply({
          content: `🔗 הנה קישור ההזמנה שלך:\n${userInvite.url}`,
        });
      } catch (error) {
        console.error(error);
        return interaction.editReply({
          content: "❌ אירעה שגיאה פנימית במהלך שליפת הנתונים מהשרת.",
        });
      }
    }
  },
};
