require('dotenv').config();
const emoji = require('./utils/emoji');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { loadCommands, reloadCommands, handleInteraction } = require('./utils/commandHandler');
const { startRPCRotation } = require('./utils/rpc');
const { autoDeployCommands, startAutoRefreshSchedule } = require('./utils/autoDeploy');
const WebhookLogger = require('./utils/webhookLogger');
const { logCredentialStatus } = require('./utils/clientSecret');
const config = require('./config');

// Validate all Discord credentials before starting
console.log(`\n${emoji.lock} VALIDATING DISCORD CREDENTIALS...`);
const credentialCheck = logCredentialStatus();

if (!credentialCheck.valid) {
    console.error(`${emoji.error} Startup failed: Missing required credentials`);
    process.exit(1);
}

// Initialize webhook logger
const webhookLogger = new WebhookLogger(process.env.ERROR_WEBHOOK_URL);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.AutoModerationExecution
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

loadCommands(client);

client.reloadCommands = () => reloadCommands(client);
client.webhookLogger = webhookLogger;

// Store auto-deploy state on client
client.autoDeployEnabled = config.autoDeploy?.enabled ?? true;
client.autoRefreshIntervalId = null;

const messageCreate = require('./events/messageCreate');
const guildMemberAdd = require('./events/guildMemberAdd');
const guildCreate = require('./events/guildCreate');
const guildBanAdd = require('./events/guildBanAdd');
const channelDelete = require('./events/channelDelete');
const roleDelete = require('./events/roleDelete');
const autoModerationActionExecution = require('./events/autoModerationActionExecution');

client.on('ready', async () => {
    console.log(`Bot is online as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} servers`);
    
    if (webhookLogger.enabled) {
        await webhookLogger.sendInfo('Bot Started', `Bot is now online as ${client.user.tag}`, {
            info: `Serving ${client.guilds.cache.size} servers`
        });
    }
    
    // Auto-deploy commands on startup
    if (client.autoDeployEnabled) {
        const token = process.env.DISCORD_BOT_TOKEN || process.env.TOKEN;
        const clientId = process.env.CLIENT_ID;
        
        if (token && clientId) {
            await autoDeployCommands(token, clientId, { silent: false, webhookLogger });
            
            // Start auto-refresh schedule (hourly)
            const refreshInterval = config.autoDeploy?.refreshIntervalMs || 3600000;
            client.autoRefreshIntervalId = await startAutoRefreshSchedule(client, token, clientId, refreshInterval);
            console.log(`${emoji.success} Auto-refresh schedule started successfully`);
        }
    }
    
    startRPCRotation(client);
});

client.on('interactionCreate', async (interaction) => {
    await handleInteraction(interaction, client);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    await messageCreate.execute(message, client);
});

client.on('guildMemberAdd', (member) => {
    guildMemberAdd.execute(member, client);
});

client.on('guildCreate', (guild) => {
    guildCreate.execute(guild, client);
});

client.on('guildBanAdd', (ban) => {
    guildBanAdd.execute(ban, client);
});

client.on('channelDelete', (channel) => {
    channelDelete.execute(channel, client);
});

client.on('roleDelete', (role) => {
    roleDelete.execute(role, client);
});

client.on('autoModerationActionExecution', (action) => {
    autoModerationActionExecution.execute(action, client);
});

client.on('guildMemberRemove', async (member) => {
    const { antiNukeTracking } = require('./utils/database');
    
    if (!config.antinuke.enabled) return;
    
    try {
        if (!member || !member.guild) return;
        
        const fetchedLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 20
        }).catch(() => null);
        
        if (!fetchedLogs) return;
        
        const kickLog = fetchedLogs.entries.first();
        if (!kickLog) return;
        
        const { executor } = kickLog;
        if (!executor || executor.id === client.user.id) return;
        
        const kickCount = antiNukeTracking.track(member.guild.id, executor.id, 'kick');
        
        if (kickCount >= config.antinuke.maxKicksPerMinute) {
            const executorMember = await member.guild.members.fetch(executor.id).catch(() => null);
            
            if (executorMember && executorMember.bannable) {
                await executorMember.ban({ reason: 'Anti-nuke: Mass kick detected' });
                console.log(`✅ Anti-nuke: Banned ${executor.tag} for mass kicking`);
            }
        }
    } catch (error) {
        if (error.code !== 10004) {
            console.error('Error in kick detection:', error.message);
        }
    }
});

const token = process.env.DISCORD_BOT_TOKEN || process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

// Additional validation with detailed error messages
if (!token || !clientId) {
    console.error('\n❌ ERROR: CRITICAL DISCORD CREDENTIALS MISSING!\n');
    if (!token) {
        console.error('  ❌ DISCORD_BOT_TOKEN is not set');
        console.error('     Set in Wispbyte Environment Variables as: DISCORD_BOT_TOKEN');
    }
    if (!clientId) {
        console.error('  ❌ CLIENT_ID is not set');
        console.error('     Set in Wispbyte Environment Variables as: CLIENT_ID');
    }
    console.error('\n📌 Get credentials from: https://discord.com/developers/applications\n');
    process.exit(1);
}

// Optional: Log if CLIENT_SECRET is missing
if (!clientSecret) {
    console.warn('\n⚠️  WARNING: CLIENT_SECRET not configured (optional but recommended)');
    console.warn('   For production, set CLIENT_SECRET in Wispbyte Environment Variables\n');
}

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    webhookLogger.sendError('Uncaught Exception', error.message, {
        errorCode: error.code || 'UNCAUGHT',
        stack: error.stack
    });
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    webhookLogger.sendError('Unhandled Rejection', String(reason), {
        errorCode: 'UNHANDLED_REJECTION',
        stack: reason?.stack || 'No stack trace available'
    });
});

client.login(token).catch(error => {
    console.error('Failed to login:', error.message);
    webhookLogger.sendError('Bot Login Failed', error.message, { 
        errorCode: error.code || 'LOGIN_FAILED',
        stack: error.stack 
    }).then(() => process.exit(1));
});
