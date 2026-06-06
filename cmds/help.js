const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View available features and server information"),

  async execute(interaction) {
    const mainEmbed = new EmbedBuilder()
      .setColor("#1E1F22")
      .setTitle("📚 מדריך השרת")
      .setDescription(
        "ברוכים הבאים לשרת! השתמשו בתפריט הבחירה למטה כדי ללמוד על מערכות השרת, הקרדיטים וההטבות הזמינות לכם.",
      )
      .addFields(
        {
          name: "🪙 קרדיטים ופרסים",
          value:
            "גלו כיצד להרוויח קרדיטים באמצעות פרסים יומיים, בוסטים והזמנת חברים.",
          inline: false,
        },
        {
          name: "🚀 מערכת הספאמר",
          value: "מידע על מערכת הספאמר, אופן השימוש בה ועלויות הקרדיטים.",
          inline: false,
        },
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: `${interaction.guild.name}`,
      });

    const menuRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("help_category_select")
        .setPlaceholder("בחרו קטגוריה...")
        .addOptions([
          {
            label: "תפריט ראשי",
            description: "חזרה לעמוד הראשי",
            value: "help_main",
            emoji: "📚",
          },
          {
            label: "קרדיטים וכלכלה",
            description: "דרכים להרוויח קרדיטים",
            value: "help_credits",
            emoji: "🪙",
          },
          {
            label: "מערכת הספאמר",
            description: "מידע ושימוש במערכת הספאמר",
            value: "help_community",
            emoji: "🚀",
          },
        ]),
    );

    await interaction.reply({
      embeds: [mainEmbed],
      components: [menuRow],
    });
  },

  async handleMenu(interaction) {
    const { values } = interaction;
    const selection = values[0];

    const updateEmbed = new EmbedBuilder().setColor("#1E1F22");

    if (selection === "help_main") {
      updateEmbed
        .setTitle("📚 מדריך השרת")
        .setDescription(
          "ברוכים הבאים לשרת! השתמשו בתפריט הבחירה למטה כדי ללמוד על מערכות השרת, הקרדיטים וההטבות הזמינות לכם.",
        )
        .addFields(
          {
            name: "🪙 קרדיטים ופרסים",
            value:
              "גלו כיצד להרוויח קרדיטים באמצעות פרסים יומיים, בוסטים והזמנת חברים.",
            inline: false,
          },
          {
            name: "🚀 מערכת הספאמר",
            value: "מידע על מערכת הספאמר, אופן השימוש בה ועלויות הקרדיטים.",
            inline: false,
          },
        )
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }));
    }

    if (selection === "help_credits") {
      updateEmbed
        .setTitle("🪙 קרדיטים וכלכלה")
        .setDescription("ניתן להגדיל את יתרת הקרדיטים שלכם באמצעות מספר דרכים:")
        .addFields(
          {
            name: "📅 פרס יומי",
            value: "אספו את הפרס היומי שלכם בכל יום וקבלו קרדיטים בחינם.",
          },
          {
            name: "🚀 Server Boost",
            value: "בצעו Boost לשרת וקבלו הטבות מיוחדות לצד בונוס קרדיטים.",
          },
          {
            name: "📩 הזמנת חברים",
            value:
              "הזמינו חברים לשרת וקבלו קרדיטים על כל משתמש חדש שמצטרף ומאמת את החשבון שלו.",
          },
        );
    }

    if (selection === "help_community") {
      updateEmbed
        .setTitle("🚀 מערכת הספאמר")
        .setDescription("כאן תוכלו ללמוד כיצד להשתמש במערכת הספאמר של השרת.")
        .addFields(
          {
            name: "📍 חדר הספאמר",
            value:
              "כדי להשתמש במערכת, היכנסו לערוץ <#1511775823437234288>. אם הערוץ אינו מופיע, ייתכן שהוא נמצא בתחזוקה או אינו זמין כרגע.",
          },
          {
            name: "⚙️ כיצד משתמשים?",
            value:
              "לחצו על כפתור ההפעלה, הזינו מספר טלפון תקין בן 10 ספרות המתחיל ב־05, ולאחר מכן בחרו את כמות הקרדיטים שברצונכם להשתמש בה.",
          },
          {
            name: "🪙 עלות הקרדיטים",
            value: "כל קרדיט מעניק 6 שניות שימוש במערכת הספאמר.",
          },
        );
    }

    await interaction.update({
      embeds: [updateEmbed],
    });
  },
};
