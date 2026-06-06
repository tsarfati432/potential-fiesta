const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

function createWelcomeEmbed(member) {
  const { guild, user } = member;

  return new EmbedBuilder()
    .setColor("#1E1F22")
    .setTitle("👋 Welcome to the server!")
    .setDescription(
      `Hey ${user}, Welcome to **${guild.name}**\n\n📊 **Member Count:**\n**${guild.memberCount}**`,
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("testwelcome")
    .setDescription("Simulates a welcome screen to see how sexy it looks")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = createWelcomeEmbed(interaction.member);
    await interaction.reply({
      content: `${interaction.user}`,
      embeds: [embed],
    });
  },

  async onJoin(member) {
    const welcomeChannelId = "1511775233668022485";

    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    const embed = createWelcomeEmbed(member);

    await channel.send({ content: `${member}`, embeds: [embed] });
  },
};
