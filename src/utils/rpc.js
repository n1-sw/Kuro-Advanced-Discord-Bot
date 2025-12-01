const { ActivityType, PresenceUpdateStatus } = require('discord.js');
const os = require('os');

let currentActivityIndex = 0;
let startTime = Date.now();
let commandsProcessed = 0;
let membersHelped = 0;
let transactionsCount = 0;

// Helper: Format bytes to readable format
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Helper: Format uptime
const formatUptime = (ms) => {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

// Get bot health status
const getBotHealth = (client) => {
    const ramPercent = (os.freemem() / os.totalmem()) * 100;
    const cpuLoad = (os.loadavg()[0] / os.cpus().length) * 100;
    const ping = client.ws.ping;
    
    // Determine health based on metrics
    if (ramPercent < 10 || cpuLoad > 80 || ping > 200) {
        return { status: 'CRITICAL', emoji: '🔴', text: 'Critical' };
    } else if (ramPercent < 20 || cpuLoad > 60 || ping > 150) {
        return { status: 'WARNING', emoji: '🟠', text: 'Warning' };
    } else if (ramPercent < 30 || cpuLoad > 40) {
        return { status: 'GOOD', emoji: '🟡', text: 'Good' };
    }
    return { status: 'HEALTHY', emoji: '🟢', text: 'Healthy' };
};

// Get system metrics
const getSystemMetrics = (client) => {
    const uptime = Date.now() - startTime;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);
    const freeRamPercent = Math.round((freeMem / totalMem) * 100);
    
    const cpuLoad = os.loadavg();
    const cpuPercent = Math.round((cpuLoad[0] / os.cpus().length) * 100);
    
    const systemUptime = os.uptime() * 1000;
    const systemUptimePercent = Math.round((systemUptime / (30 * 24 * 60 * 60 * 1000)) * 100); // 30-day baseline
    
    const guildCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const ping = client.ws.ping;
    
    const hourlyCommandRate = Math.round((commandsProcessed / Math.max(1, uptime / 3600000)) * 10) / 10;
    
    return {
        ramUsage: formatBytes(usedMem),
        ramPercent,
        freeRamPercent,
        totalRam: formatBytes(totalMem),
        cpuPercent,
        uptime: formatUptime(uptime),
        systemUptime: formatUptime(systemUptime),
        guilds: guildCount,
        users: userCount,
        ping: ping >= 0 ? ping : 'N/A',
        commandsProcessed,
        membersHelped,
        transactionsCount,
        hourlyCommandRate,
        health: getBotHealth(client)
    };
};

// Get dynamic activities
const getActivities = (client) => {
    const metrics = getSystemMetrics(client);
    
    return [
        // ===== SYSTEM HEALTH =====
        { 
            name: `${metrics.health.text} | ${metrics.ramPercent}% RAM | ${metrics.cpuPercent}% CPU`, 
            type: ActivityType.Watching, 
            status: PresenceUpdateStatus.Online 
        },
        
        // ===== PERFORMANCE METRICS =====
        { 
            name: `Ping: ${metrics.ping}ms | Free RAM: ${metrics.freeRamPercent}%`, 
            type: ActivityType.Watching, 
            status: PresenceUpdateStatus.Online 
        },
        { 
            name: `Processing: ${metrics.hourlyCommandRate} cmds/hour`, 
            type: ActivityType.Playing, 
            status: PresenceUpdateStatus.Online 
        },
        
        // ===== UPTIME & RELIABILITY =====
        { 
            name: `Bot Uptime: ${metrics.uptime}`, 
            type: ActivityType.Playing, 
            status: PresenceUpdateStatus.Online 
        },
        { 
            name: `System Runtime: ${metrics.systemUptime}`, 
            type: ActivityType.Watching, 
            status: PresenceUpdateStatus.Online 
        },
        
        // ===== DISCORD PRESENCE =====
        { 
            name: `${metrics.guilds.toLocaleString()} Servers Protected`, 
            type: ActivityType.Playing, 
            status: PresenceUpdateStatus.Online 
        },
        { 
            name: `Serving ${metrics.users.toLocaleString()} Members`, 
            type: ActivityType.Listening, 
            status: PresenceUpdateStatus.Online 
        },
        
        // ===== ACTIVITY TRACKING =====
        { 
            name: `${metrics.commandsProcessed} Commands Executed`, 
            type: ActivityType.Competing, 
            status: PresenceUpdateStatus.Online 
        },
        { 
            name: `${metrics.membersHelped} Members Helped Today`, 
            type: ActivityType.Listening, 
            status: PresenceUpdateStatus.Online 
        },
        { 
            name: `${metrics.transactionsCount} Economy Transactions`, 
            type: ActivityType.Playing, 
            status: PresenceUpdateStatus.Online 
        },
        
        // ===== USEFUL CALLS-TO-ACTION =====
        { 
            name: `/help to see all commands!`, 
            type: ActivityType.Watching, 
            status: PresenceUpdateStatus.Online 
        },
        { 
            name: `/moderation for server safety`, 
            type: ActivityType.Playing, 
            status: PresenceUpdateStatus.Online 
        },
        { 
            name: `/economy to start earning!`, 
            type: ActivityType.Playing, 
            status: PresenceUpdateStatus.Online 
        },
        { 
            name: `/rank to check your level`, 
            type: ActivityType.Playing, 
            status: PresenceUpdateStatus.Online 
        },
        { 
            name: `24/7 Server Protection ON`, 
            type: ActivityType.Competing, 
            status: PresenceUpdateStatus.Online 
        },
        
        // ===== FEATURE HIGHLIGHTS =====
        { 
            name: `Anti-Nuke Protection Active`, 
            type: ActivityType.Competing, 
            status: PresenceUpdateStatus.Online 
        },
        { 
            name: `Auto-Moderation Scanning...`, 
            type: ActivityType.Watching, 
            status: PresenceUpdateStatus.Online 
        }
    ];
};

const getStatusEmoji = (status) => {
    switch (status) {
        case PresenceUpdateStatus.Online:
            return '🟢 Online';
        case PresenceUpdateStatus.Idle:
            return '🟡 Idle';
        case PresenceUpdateStatus.DoNotDisturb:
            return '🔴 Do Not Disturb';
        case PresenceUpdateStatus.Invisible:
            return '⚫ Invisible';
        default:
            return '🟢 Online';
    }
};

const getActivityTypeText = (type) => {
    switch (type) {
        case ActivityType.Playing:
            return '▶️ Playing';
        case ActivityType.Listening:
            return '🎧 Listening to';
        case ActivityType.Watching:
            return '👀 Watching';
        case ActivityType.Competing:
            return '🏆 Competing in';
        case ActivityType.Streaming:
            return '📡 Streaming';
        default:
            return '•';
    }
};

const setAdvancedActivity = (client) => {
    const activities = getActivities(client);
    const activity = activities[currentActivityIndex];
    
    try {
        client.user.setPresence({
            activities: [{
                name: activity.name,
                type: activity.type,
                url: activity.url || undefined
            }],
            status: activity.status
        });
        
        console.log(`🎰 RPC Updated: ${getActivityTypeText(activity.type)} ${activity.name} | ${getStatusEmoji(activity.status)}`);
        
        currentActivityIndex = (currentActivityIndex + 1) % activities.length;
    } catch (error) {
        console.error('Error setting activity:', error.message);
    }
};

const startRPCRotation = (client) => {
    // Set initial activity immediately
    setAdvancedActivity(client);
    
    // Update every 12 seconds for smooth rotation
    const rpcInterval = setInterval(() => {
        setAdvancedActivity(client);
    }, 12000);
    
    // Store interval on client for cleanup if needed
    client.rpcInterval = rpcInterval;
    
    console.log('🎮 Advanced RPC System Started');
    console.log('   📊 Tracking: Health | Performance | Uptime | Servers | Members | Commands | Features');
    console.log('   🔄 Rotating Status Every 12 Seconds');
};

// Export functions to track metrics from other modules
const trackCommand = () => commandsProcessed++;
const trackMemberHelped = () => membersHelped++;
const trackTransaction = () => transactionsCount++;
const incrementCommands = (count = 1) => { commandsProcessed += count; };
const incrementMembers = (count = 1) => { membersHelped += count; };
const incrementTransactions = (count = 1) => { transactionsCount += count; };

module.exports = {
    startRPCRotation,
    setAdvancedActivity,
    getSystemMetrics,
    getBotHealth,
    trackCommand,
    trackMemberHelped,
    trackTransaction,
    incrementCommands,
    incrementMembers,
    incrementTransactions
};
