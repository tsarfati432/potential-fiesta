const { MessageFlags } = require("discord.js");

const BYPASS_ROLES = [
  "1511776345343000747",
  "1511776275646251059",
  "1511776748038258748",
];

module.exports = {
  async handleMessage(message) {
    if (!message.guild || message.author.bot) return;

    const hasBypass = message.member.roles.cache.some((role) =>
      BYPASS_ROLES.includes(role.id),
    );
    if (hasBypass) return;

    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    if (linkRegex.test(message.content)) {
      try {
        await message.delete();
        const warning = await message.channel.send({
          content: `❌${message.author} You cant send link here!`,
        });
        setTimeout(() => warning.delete().catch(() => {}), 5000);
      } catch (err) {
        console.error("Error handling anti-link deletion:", err);
      }
    }
  },
};
