// Configuration IDs
const TARGET_BOT_ID = "1511789056089129011";
const STATUS_VC_ID = "1511810781182689361";
const MEMBERS_VC_ID = "1512111360882774108"; // <-- REPLACE WITH YOUR MEMBERS VC ID

module.exports = {
  initStatsUpdater(client) {
    // Run bot status check immediately, then every 5 minutes
    this.updateBotStatus(client);
    setInterval(() => {
      this.updateBotStatus(client);
    }, 300000);

    // Run member count once at startup
    this.updateMemberCount(client);
  },

  // 1. INSTANT MEMBER COUNT ENGINE (Called by events in index.js)
  async updateMemberCount(client) {
    try {
      const guild = client.guilds.cache.first();
      if (!guild) return;

      const membersChannel = guild.channels.cache.get(MEMBERS_VC_ID);
      if (!membersChannel) return;

      const fullGuild = await guild.fetch();
      const totalMembers = fullGuild.memberCount;
      const newName = `🔮 ｜Members: ${totalMembers}`;

      if (membersChannel.name !== newName) {
        await membersChannel
          .setName(newName)
          .catch((err) =>
            console.log(
              "Rate limited on members join/leave change. Will try next time.",
            ),
          );
      }
    } catch (error) {
      console.error("Error updating member count channel:", error);
    }
  },

  // 2. TIMED BOT STATUS ENGINE (Stays on 5 minutes to remain safe)
  async updateBotStatus(client) {
    try {
      const guild = client.guilds.cache.first();
      if (!guild) return;

      const statusChannel = guild.channels.cache.get(STATUS_VC_ID);
      if (!statusChannel) return;

      const botMember = await guild.members
        .fetch(TARGET_BOT_ID)
        .catch(() => null);
      const isOnline =
        botMember &&
        botMember.presence &&
        botMember.presence.status !== "offline";

      const currentName = statusChannel.name;
      let newStatusName = currentName;

      if (isOnline) {
        if (currentName.includes("🔴")) {
          newStatusName = currentName.replace("🔴", "🟢");
        } else if (!currentName.includes("🟢")) {
          newStatusName = `🟢 ${currentName}`;
        }
      } else {
        if (currentName.includes("🟢")) {
          newStatusName = currentName.replace("🟢", "🔴");
        } else if (!currentName.includes("🔴")) {
          newStatusName = `🔴 ${currentName}`;
        }
      }

      if (currentName !== newStatusName) {
        await statusChannel
          .setName(newStatusName)
          .catch((err) =>
            console.log("Bot status channel rate limited. Skipping loop."),
          );
      }
    } catch (error) {
      console.error("Error updating bot status channel:", error);
    }
  },
};
