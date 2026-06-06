const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  MessageFlags,
  ActivityType,
} = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.commands = new Collection();
const commandsData = [];

const commandFiles = fs
  .readdirSync("./cmds")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./cmds/${file}`);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commandsData.push(command.data.toJSON());
  }
}

client.once("ready", async () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.first();
  let statusText = "0x Spammer | Calculating...";

  if (guild) {
    try {
      const fullGuild = await guild.fetch();
      statusText = `0xמSpammer | ${fullGuild.memberCount} Members`;
    } catch (err) {
      console.error(err);
    }
  }

  client.user.setPresence({
    activities: [
      {
        name: statusText,
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });

  const statsHandler = require("./cmds/stats.js");
  statsHandler.initStatsUpdater(client);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("Started refreshing application (/) commands...");

    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
      { body: commandsData },
    );

    console.log("Successfully reloaded application (/) commands instantly.");
  } catch (error) {
    console.error(error);
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    const antilinkHandler = require("./cmds/antilink.js");
    await antilinkHandler.handleMessage(message);

    const verifyHandler = require("./cmds/verify.js");
    if (verifyHandler.handleMessage) await verifyHandler.handleMessage(message);

    const feedbackHandler = require("./cmds/feedback.js");
    if (feedbackHandler.handleMessage)
      await feedbackHandler.handleMessage(message);

    const boostHandler = require("./cmds/boost.js");
    if (boostHandler.handleMessage) await boostHandler.handleMessage(message);
  } catch (err) {
    console.error(err);
  }
});

client.on("messageDelete", async (message) => {
  try {
    const logsHandler = require("./cmds/logs.js");
    if (logsHandler.handleMessageDelete)
      await logsHandler.handleMessageDelete(message);
  } catch (err) {
    console.error(err);
  }
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  try {
    const logsHandler = require("./cmds/logs.js");
    if (logsHandler.handleMessageUpdate)
      await logsHandler.handleMessageUpdate(oldMessage, newMessage);
  } catch (err) {
    console.error(err);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "help_category_select") {
      try {
        const helpHandler = require("./cmds/help.js");
        if (helpHandler.handleMenu) await helpHandler.handleMenu(interaction);
      } catch (err) {
        console.error(err);
      }
    }
    if (interaction.customId === "ticket_category_select") {
      try {
        const ticketSetupHandler = require("./cmds/ticket_setup.js");
        if (ticketSetupHandler.handleMenu)
          await ticketSetupHandler.handleMenu(interaction);
      } catch (err) {
        console.error(err);
      }
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === "feedback_form_modal") {
      try {
        const feedbackHandler = require("./cmds/feedback.js");
        if (feedbackHandler.handleModal)
          await feedbackHandler.handleModal(interaction);
      } catch (err) {
        console.error(err);
      }
    }
    if (interaction.customId === "giveaway_creation_modal") {
      try {
        const giveawayHandler = require("./cmds/giveaway.js");
        if (giveawayHandler.handleModal)
          await giveawayHandler.handleModal(interaction);
      } catch (err) {
        console.error(err);
      }
    }
    if (interaction.customId === "custom_invite_modal") {
      try {
        const inviteHandler = require("./cmds/invitemake.js");
        if (inviteHandler.handleModal)
          await inviteHandler.handleModal(interaction);
      } catch (err) {
        console.error(err);
      }
    }
    return;
  }

  if (interaction.isButton()) {
    try {
      switch (interaction.customId) {
        case "verify_user_button": {
          const verifyHandler = require("./cmds/verify.js");
          if (verifyHandler.handleButton)
            await verifyHandler.handleButton(interaction);
          break;
        }
        case "create_ticket_btn":
        case "claim_ticket_btn":
        case "close_ticket_btn":
        case "delete_ticket_btn": {
          const ticketHandler = require("./cmds/ticket_setup.js");
          if (ticketHandler.handleButton)
            await ticketHandler.handleButton(interaction);
          break;
        }
        case "open_feedback_modal_btn":
        case "submit_feedback_public":
        case "submit_feedback_anon":
        case "log_feedback_action_btn": {
          const feedbackHandler = require("./cmds/feedback.js");
          if (feedbackHandler.handleButton)
            await feedbackHandler.handleButton(interaction);
          break;
        }
        case "generate_custom_invite_btn":
        case "receive_invite_btn": {
          const inviteHandler = require("./cmds/invitemake.js");
          if (inviteHandler.handleButton)
            await inviteHandler.handleButton(interaction);
          break;
        }
      }
    } catch (err) {
      console.error(err);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    try {
      await interaction.reply({
        content: "There was an error executing this command!",
        flags: [MessageFlags.Ephemeral],
      });
    } catch {
      console.log("Failed to send error fallback response.");
    }
  }
});

client.on("guildMemberAdd", async (member) => {
  try {
    const welcomeHandler = require("./cmds/welcome.js");
    if (welcomeHandler.onJoin) await welcomeHandler.onJoin(member);

    const statsHandler = require("./cmds/stats.js");
    if (statsHandler.updateMemberCount)
      await statsHandler.updateMemberCount(member.client);

    member.client.user.setPresence({
      activities: [
        {
          name: `0x Spammer | ${member.guild.memberCount} Members`,
          type: ActivityType.Watching,
        },
      ],
      status: "online",
    });
  } catch (err) {
    console.error(err);
  }
});

client.on("guildMemberRemove", async (member) => {
  try {
    const statsHandler = require("./cmds/stats.js");
    if (statsHandler.updateMemberCount)
      await statsHandler.updateMemberCount(member.client);

    member.client.user.setPresence({
      activities: [
        {
          name: `0x Spammer | ${member.guild.memberCount} Members`,
          type: ActivityType.Watching,
        },
      ],
      status: "online",
    });
  } catch (err) {
    console.error(err);
  }
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const boostHandler = require("./cmds/boost.js");
    if (boostHandler.handleGuildMemberUpdate)
      await boostHandler.handleGuildMemberUpdate(oldMember, newMember);
  } catch (err) {
    console.error(err);
  }
});

client.login(process.env.TOKEN);
