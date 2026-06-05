require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_TOKEN;       // Your bot token
const CLIENT_ID = '1512449170202562661';
const GUILD_ID = '1512425758902194388';

// Map each Discord User ID to the Role ID they "own"
const USER_ROLE_MAP = {
  '805869318461849600': '1512428662497218732',   // user1 → role1
  '1076794597650477146': '1512452391641809026',  // user2 → role2
  '867829327130001409': '1512452522428858428',   // user3 → role3
};
// ──────────────────────────────────────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Register the /color slash command
async function registerCommands() {
  const command = new SlashCommandBuilder()
    .setName('color')
    .setDescription('Change your role color')
    .addStringOption(option =>
      option
        .setName('hex')
        .setDescription('Hex color code, e.g. #ff5733 or ff5733')
        .setRequired(true)
    );

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('Registering slash command...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [command.toJSON()] }
    );
    console.log('✅ Slash command registered.');
  } catch (err) {
    console.error('Failed to register command:', err);
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'color') return;

  const userId = interaction.user.id;
  const roleId = USER_ROLE_MAP[userId];

  // Check if this user has an assigned role
  if (!roleId) {
    return interaction.reply({
      content: '❌ You don\'t have an assigned role to recolor.',
      ephemeral: true,
    });
  }

  // Parse and validate the hex color
  let hex = interaction.options.getString('hex').trim().replace(/^#/, '');
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return interaction.reply({
      content: '❌ Invalid hex color. Please use a 6-digit hex like `#ff5733` or `ff5733`.',
      ephemeral: true,
    });
  }

  const colorInt = parseInt(hex, 16);

  try {
    const guild = interaction.guild;
    const role = await guild.roles.fetch(roleId);

    if (!role) {
      return interaction.reply({
        content: '❌ Could not find your role. Please contact an admin.',
        ephemeral: true,
      });
    }

    await role.setColor(colorInt, `Color changed by ${interaction.user.tag}`);

    return interaction.reply({
      content: `✅ Your role color has been updated to **#${hex.toUpperCase()}**!`,
      ephemeral: true,
    });
  } catch (err) {
    console.error('Error updating role color:', err);
    return interaction.reply({
      content: '❌ Failed to update color. Make sure the bot role is above your role in the server settings.',
      ephemeral: true,
    });
  }
});

client.login(TOKEN);