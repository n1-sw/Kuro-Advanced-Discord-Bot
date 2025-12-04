const { EmbedBuilder, WebhookClient } = require('discord.js');
const emoji = require('./emoji');
const os = require('os');

class FakeConsole {
    constructor(webhookUrl, client) {
        this.client = client;
        this.webhookClient = null;
        this.startTime = Date.now();
        this.updateInterval = null;
        this.commandsExecuted = 0;
        this.errorsLogged = 0;
        this.lastUpdate = null;
        
        if (webhookUrl) {
            try {
                this.webhookClient = new WebhookClient({ url: webhookUrl });
                console.log(`${emoji.console} Fake Console webhook initialized`);
            } catch (error) {
                console.error(`${emoji.error} Failed to initialize Fake Console webhook:`, error.message);
            }
        }
    }
    
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }
    
    getSystemStats() {
        const memUsage = process.memoryUsage();
        const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
        const rss = Math.round(memUsage.rss / 1024 / 1024);
        
        const cpuUsage = os.loadavg()[0];
        const totalMem = Math.round(os.totalmem() / 1024 / 1024);
        const freeMem = Math.round(os.freemem() / 1024 / 1024);
        const usedMem = totalMem - freeMem;
        const memPercent = Math.round((usedMem / totalMem) * 100);
        
        return {
            heapUsed,
            heapTotal,
            rss,
            cpuUsage: cpuUsage.toFixed(2),
            totalMem,
            freeMem,
            usedMem,
            memPercent
        };
    }
    
    getBotStats() {
        if (!this.client || !this.client.isReady()) {
            return {
                servers: 0,
                users: 0,
                channels: 0,
                ping: 0,
                commands: 0
            };
        }
        
        return {
            servers: this.client.guilds.cache.size,
            users: this.client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0),
            channels: this.client.channels.cache.size,
            ping: this.client.ws.ping,
            commands: this.client.commands ? this.client.commands.size : 0
        };
    }
    
    recordCommand() {
        this.commandsExecuted++;
    }
    
    recordError() {
        this.errorsLogged++;
    }
    
    async sendUpdate() {
        if (!this.webhookClient || !this.client?.isReady()) return;
        
        try {
            const now = Date.now();
            const botUptime = this.client.uptime || 0;
            const processUptime = now - this.startTime;
            
            const systemStats = this.getSystemStats();
            const botStats = this.getBotStats();
            
            const statusColor = systemStats.memPercent > 90 
                ? emoji.color_error 
                : systemStats.memPercent > 70 
                    ? emoji.color_warning 
                    : emoji.color_success;
            
            const healthStatus = systemStats.memPercent > 90 
                ? `${emoji.error} Critical` 
                : systemStats.memPercent > 70 
                    ? `${emoji.warning} Warning` 
                    : `${emoji.success} Healthy`;
            
            const consoleOutput = [
                '```ansi',
                `\u001b[1;32m[SYSTEM]\u001b[0m Bot Console - Live Status`,
                `\u001b[1;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m`,
                '',
                `\u001b[1;33m[UPTIME]\u001b[0m`,
                `  Bot Uptime:     ${this.formatUptime(botUptime)}`,
                `  Process Uptime: ${this.formatUptime(processUptime)}`,
                '',
                `\u001b[1;33m[BOT STATS]\u001b[0m`,
                `  Servers:    ${botStats.servers.toLocaleString()}`,
                `  Users:      ${botStats.users.toLocaleString()}`,
                `  Channels:   ${botStats.channels.toLocaleString()}`,
                `  Commands:   ${botStats.commands}`,
                `  Ping:       ${botStats.ping}ms`,
                '',
                `\u001b[1;33m[SYSTEM]\u001b[0m`,
                `  Memory:  ${systemStats.heapUsed}MB / ${systemStats.heapTotal}MB (${systemStats.memPercent}%)`,
                `  RSS:     ${systemStats.rss}MB`,
                `  CPU:     ${systemStats.cpuUsage}%`,
                '',
                `\u001b[1;33m[SESSION]\u001b[0m`,
                `  Commands Executed: ${this.commandsExecuted}`,
                `  Errors Logged:     ${this.errorsLogged}`,
                '',
                `\u001b[1;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m`,
                `\u001b[1;32m[STATUS]\u001b[0m ${healthStatus.replace(/[^\w\s]/g, '')}`,
                `\u001b[1;36m[TIME]\u001b[0m ${new Date().toISOString()}`,
                '```'
            ].join('\n');
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.console} Bot Console - Live Monitor`)
                .setDescription(consoleOutput)
                .setColor(statusColor)
                .addFields(
                    { 
                        name: `${emoji.uptime} Real Uptime`, 
                        value: `\`${this.formatUptime(botUptime)}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.health} Health`, 
                        value: healthStatus, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.zap} Ping`, 
                        value: `\`${botStats.ping}ms\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.server} Servers`, 
                        value: `\`${botStats.servers.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.people} Users`, 
                        value: `\`${botStats.users.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.ram} Memory`, 
                        value: `\`${systemStats.memPercent}%\``, 
                        inline: true 
                    }
                )
                .setFooter({ text: `Next update in 60 seconds • ${this.client.user?.tag || 'Bot'}` })
                .setTimestamp();
            
            await this.webhookClient.send({
                username: `${this.client.user?.username || 'Bot'} Console`,
                avatarURL: this.client.user?.displayAvatarURL(),
                embeds: [embed]
            });
            
            this.lastUpdate = now;
        } catch (error) {
            console.error(`${emoji.error} Fake Console update error:`, error.message);
        }
    }
    
    start(intervalMs = 60000) {
        if (!this.webhookClient) {
            console.log(`${emoji.warning} Fake Console not started - no webhook URL configured`);
            return;
        }
        
        console.log(`${emoji.success} Fake Console started - updating every ${intervalMs / 1000}s`);
        
        setTimeout(() => this.sendUpdate(), 5000);
        
        this.updateInterval = setInterval(() => this.sendUpdate(), intervalMs);
    }
    
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log(`${emoji.success} Fake Console stopped`);
        }
    }
    
    async sendStartupMessage() {
        if (!this.webhookClient) return;
        
        try {
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.rocket} Bot Started`)
                .setDescription(
                    `**${this.client.user?.tag || 'Bot'}** is now online!\n\n` +
                    `${emoji.server} **Servers:** ${this.client.guilds.cache.size}\n` +
                    `${emoji.people} **Users:** ${this.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toLocaleString()}\n` +
                    `${emoji.gear} **Commands:** ${this.client.commands?.size || 0}`
                )
                .setColor(emoji.color_success)
                .setTimestamp();
            
            await this.webhookClient.send({
                username: `${this.client.user?.username || 'Bot'} Console`,
                avatarURL: this.client.user?.displayAvatarURL(),
                embeds: [embed]
            });
        } catch (error) {
            console.error(`${emoji.error} Fake Console startup message error:`, error.message);
        }
    }
    
    async sendShutdownMessage(reason = 'Unknown') {
        if (!this.webhookClient) return;
        
        try {
            const uptime = this.client?.uptime || 0;
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.offline} Bot Shutdown`)
                .setDescription(
                    `**${this.client.user?.tag || 'Bot'}** is going offline.\n\n` +
                    `${emoji.uptime} **Uptime was:** ${this.formatUptime(uptime)}\n` +
                    `${emoji.document} **Reason:** ${reason}\n` +
                    `${emoji.gear} **Commands executed:** ${this.commandsExecuted}`
                )
                .setColor(emoji.color_error)
                .setTimestamp();
            
            await this.webhookClient.send({
                username: `${this.client.user?.username || 'Bot'} Console`,
                avatarURL: this.client.user?.displayAvatarURL(),
                embeds: [embed]
            });
        } catch (error) {
            console.error(`${emoji.error} Fake Console shutdown message error:`, error.message);
        }
    }
}

module.exports = FakeConsole;
