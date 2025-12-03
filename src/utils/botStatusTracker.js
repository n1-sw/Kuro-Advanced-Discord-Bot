const emoji = require('./emoji');

class BotStatusTracker {
    constructor(client, webhookLogger) {
        this.client = client;
        this.webhookLogger = webhookLogger;
        this.isOnline = false;
        this.statusHistory = [];
        this.lastStatusChange = Date.now();
        this.commandsExecuted = 0;
        this.errorsEncountered = 0;
        this.averagePing = 0;
        this.pingHistory = [];
        this.maxPingHistory = 60;
    }

    recordBotOnline() {
        if (this.isOnline) return;
        
        this.isOnline = true;
        this.lastStatusChange = Date.now();
        this.statusHistory.push({
            status: 'ONLINE',
            timestamp: new Date(),
            uptime: this.formatUptime(0)
        });

        const serverCount = this.client.guilds?.cache?.size || 0;
        const userCount = this.client.guilds?.cache?.reduce((a, g) => a + g.memberCount, 0) || 0;

        console.log(`\n${emoji.online} BOT STATUS: ONLINE`);
        console.log(`${emoji.success} Connected to ${serverCount} servers with ${userCount.toLocaleString()} members\n`);
    }

    recordBotOffline() {
        if (!this.isOnline) return;
        
        this.isOnline = false;
        this.lastStatusChange = Date.now();
        this.statusHistory.push({
            status: 'OFFLINE',
            timestamp: new Date(),
            uptime: this.formatUptime(Date.now() - this.lastStatusChange)
        });

        console.log(`\n${emoji.offline} BOT STATUS: OFFLINE`);
        console.log(`${emoji.warning} Bot has gone offline\n`);
    }

    recordCommandExecution(commandName, success = true) {
        this.commandsExecuted++;
        
        if (!success) {
            this.errorsEncountered++;
            console.log(`${emoji.warning} Command failed: ${commandName}`);
        }
    }

    recordPing(ping) {
        this.pingHistory.push(ping);
        if (this.pingHistory.length > this.maxPingHistory) {
            this.pingHistory.shift();
        }
        this.averagePing = Math.round(
            this.pingHistory.reduce((a, b) => a + b, 0) / this.pingHistory.length
        );
    }

    recordError(errorName, errorMessage) {
        this.errorsEncountered++;
        
        console.log(`${emoji.error} Error recorded: ${errorName}`);
    }

    getStatusSummary() {
        const uptime = Date.now() - this.lastStatusChange;
        const stats = {
            status: this.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE',
            isOnline: this.isOnline,
            uptime: this.formatUptime(uptime),
            uptimeMs: uptime,
            commandsExecuted: this.commandsExecuted,
            errorsEncountered: this.errorsEncountered,
            averagePing: this.averagePing,
            statusHistory: this.statusHistory.slice(-10),
            successRate: this.commandsExecuted > 0 ? 
                Math.round(((this.commandsExecuted - this.errorsEncountered) / this.commandsExecuted) * 100) : 
                100
        };
        return stats;
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    getHealthEmoji() {
        if (this.errorsEncountered > 10) return emoji.offline;
        if (this.errorsEncountered > 5) return '⚠️';
        if (this.isOnline) return emoji.online;
        return emoji.offline;
    }
}

module.exports = BotStatusTracker;
