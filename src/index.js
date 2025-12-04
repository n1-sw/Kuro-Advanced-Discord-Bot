require('dotenv').config();
const emoji = require('./utils/emoji');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { loadCommands, reloadCommands, handleInteraction } = require('./utils/commandHandler');
const { startRPCRotation } = require('./utils/rpc');
const { autoDeployCommands, startAutoRefreshSchedule } = require('./utils/autoDeploy');
const WebhookLogger = require('./utils/webhookLogger');
const StatusWebhook = require('./utils/statusWebhook');
const BotStatusTracker = require('./utils/botStatusTracker');
const { logCredentialStatus } = require('./utils/clientSecret');
const { connectDB } = require('./utils/database');
const config = require('./config');

console.log(`\n${emoji.lock} VALIDATING DISCORD CREDENTIALS...`);
const credentialCheck = logCredentialStatus();

if (!credentialCheck.valid) {
    console.error(`${emoji.error} Startup failed: Missing required credentials`);
    process.exit(1);
}

(async () => {
    console.log(`\n${emoji.pending} Connecting to MongoDB...`);
    await connectDB();
})();

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
client.statusTracker = new BotStatusTracker(client, webhookLogger);

client.autoDeployEnabled = config.autoDeploy?.enabled ?? true;
client.autoRefreshIntervalId = null;

const messageCreate = require('./events/messageCreate');
const guildMemberAdd = require('./events/guildMemberAdd');
const guildMemberRemove = require('./events/guildMemberRemove');
const guildCreate = require('./events/guildCreate');
const guildBanAdd = require('./events/guildBanAdd');
const channelDelete = require('./events/channelDelete');
const roleDelete = require('./events/roleDelete');
const autoModerationActionExecution = require('./events/autoModerationActionExecution');

let __readyHandled = false;
async function handleClientReady() {
    if (__readyHandled) return;
    __readyHandled = true;
    client.statusTracker.recordBotOnline();
    console.log(`${emoji.success} Bot is online as ${client.user.tag}`);
    console.log(`${emoji.server} Serving ${client.guilds.cache.size} servers`);

    if (client.autoDeployEnabled) {
        const token = process.env.DISCORD_BOT_TOKEN || process.env.TOKEN;
        const clientId = process.env.CLIENT_ID;

        if (token && clientId) {
            await autoDeployCommands(token, clientId, { silent: false, webhookLogger });

            const refreshInterval = config.autoDeploy?.refreshIntervalMs || 3600000;
            client.autoRefreshIntervalId = await startAutoRefreshSchedule(client, token, clientId, refreshInterval);
            console.log(`${emoji.success} Auto-refresh schedule started successfully`);
        }
    }

    if (process.env.STATUS_WEBHOOK_URL) {
        const statusWebhook = new StatusWebhook(process.env.STATUS_WEBHOOK_URL, client);
        statusWebhook.start(30000);
        client.statusWebhook = statusWebhook;
    }

    startRPCRotation(client);
}

// Use the new `clientReady` event. Listening to `ready` triggers a deprecation warning
// in newer discord.js versions, so avoid registering for it to keep startup clean.
client.on('clientReady', handleClientReady);

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const commandName = interaction.commandName;
        const startTime = Date.now();
        try {
            await handleInteraction(interaction, client);
            const executionTime = Date.now() - startTime;
            client.statusTracker.recordCommandExecution(commandName, true);
            client.webhookLogger.recordCommand(commandName, true, executionTime, interaction.user.id, interaction.guild?.id);
        } catch (error) {
            const executionTime = Date.now() - startTime;
            client.statusTracker.recordCommandExecution(commandName, false);
            client.webhookLogger.recordCommand(commandName, false, executionTime, interaction.user.id, interaction.guild?.id);
            throw error;
        }
    } else {
        client.webhookLogger.recordInteraction(interaction.type, interaction.user.id, interaction.guild?.id, { customId: interaction.customId });
        await handleInteraction(interaction, client);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    client.webhookLogger.recordMessage(message.author.id, message.content, message.guild?.id);
    await messageCreate.execute(message, client);
});

client.on('guildMemberAdd', (member) => {
    client.webhookLogger.recordEvent('MEMBER_JOIN', { userId: member.id, guildId: member.guild.id, memberCount: member.guild.memberCount });
    guildMemberAdd.execute(member, client);
});

client.on('guildMemberRemove', async (member) => {
    client.webhookLogger.recordEvent('MEMBER_LEAVE', { userId: member.id, guildId: member.guild.id });
    guildMemberRemove.execute(member, client);
    
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
                console.log(`${emoji.success} Anti-nuke: Banned ${executor.tag} for mass kicking`);
            }
        }
    } catch (error) {
        if (error.code !== 10004) {
            console.error('Error in kick detection:', error.message);
        }
    }
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

const token = process.env.DISCORD_BOT_TOKEN || process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

if (!token || !clientId) {
    console.error(`\n${emoji.error} ERROR: CRITICAL DISCORD CREDENTIALS MISSING!\n`);
    if (!token) {
        console.error(`  ${emoji.error} DISCORD_BOT_TOKEN is not set`);
    }
    if (!clientId) {
        console.error(`  ${emoji.error} CLIENT_ID is not set`);
    }
    console.error('\n📌 Get credentials from: https://discord.com/developers/applications\n');
    process.exit(1);
}

if (!clientSecret) {
    console.warn(`\n${emoji.warning} WARNING: CLIENT_SECRET not configured (optional but recommended)\n`);
}

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (client.statusTracker) client.statusTracker.recordError('Uncaught Exception', error.message);
    webhookLogger.sendError('Uncaught Exception', error.message, {
        errorCode: error.code || 'UNCAUGHT',
        stack: error.stack
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    if (client.statusTracker) client.statusTracker.recordError('Unhandled Rejection', String(reason));
    webhookLogger.sendError('Unhandled Rejection', String(reason), {
        errorCode: 'UNHANDLED_REJECTION',
        stack: reason?.stack || 'No stack trace available'
    });
});

client.on('disconnect', () => {
    console.log(`${emoji.offline} Bot disconnected from Discord`);
    if (client.statusTracker) client.statusTracker.recordBotOffline();
});

client.on('error', (error) => {
    console.error(`${emoji.error} Client error:`, error);
    if (client.statusTracker) client.statusTracker.recordError('Client Error', error.message);
});

client.login(token).catch(error => {
    console.error('Failed to login:', error.message);
    webhookLogger.sendError('Bot Login Failed', error.message, { 
        errorCode: error.code || 'LOGIN_FAILED',
        stack: error.stack 
    }).then(() => process.exit(1));
});
