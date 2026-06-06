const { EmbedBuilder } = require("discord.js");

const BOOST_CHANNEL_ID = "1511815968580698283"; // Double-check this matches your actual channel ID!

module.exports = {
  // This watches for real boosts
  async handleGuildMemberUpdate(oldMember, newMember) {
    const wasBoosting = oldMember.premiumSince;
    const isBoosting = newMember.premiumSince;

    if (!wasBoosting && isBoosting) {
      await this.sendBoostEmbed(newMember.guild, newMember.user);
    }
  },

  // This lets you type !test_boost to make sure it works perfectly
  async handleMessage(message) {
    if (message.content !== "!test_boost") return;

    // Simple security check so only users who can manage the server can test it
    if (!message.member.permissions.has("ManageGuild")) return;

    await this.sendBoostEmbed(message.guild, message.author);
    await message.delete().catch(() => {});
  },

  // The shared design configuration
  async sendBoostEmbed(guild, user) {
    const boostChannel = guild.channels.cache.get(BOOST_CHANNEL_ID);
    if (!boostChannel) {
      console.error(
        `❌ Boost channel with ID ${BOOST_CHANNEL_ID} was not found!`,
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#ecebec")
      .setTitle("🚀 A New Booster Arrived!")
      .setDescription(
        `Thank you **${user.username}** for boosting the server!\n\n**Member:**\n${user}`,
      )
      .setFooter({
        text: "Thanks for supporting us!!",
        iconURL: guild.iconURL({ dynamic: true }),
      })
      .setTimestamp();

    await boostChannel
      .send({
        content: `${user}`,
        embeds: [embed],
      })
      .catch((err) => console.error("Boost Announcement Error:", err));
  },
};
