const { EmbedBuilder } = require('discord.js');
const os = require('os');

class StatusWebhook {
    constructor(webhookUrl, client) {
        this.webhookUrl = webhookUrl;
        this.client = client;
        this.messageId = null;
        this.enabled = this.validateUrl(webhookUrl);
        this.startTime = Date.now();
        this.intervalId = null;
        this.previousHeapUsed = 0;
        this.commandCount = 0;
        this.errorCount = 0;
        this.latencyHistory = [];
        this.lastCheck = Date.now();
    }

    validateUrl(url) {
        if (!url) return false;
        try {
            return url.startsWith('https://discord.com/api/webhooks/');
        } catch {
            return false;
        }
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

    getSystemStats() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryPercent = Math.round((usedMemory / totalMemory) * 100);

        const cpus = os.cpus();
        let cpuUsage = 0;
        for (const cpu of cpus) {
            const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
            const idle = cpu.times.idle;
            cpuUsage += ((total - idle) / total) * 100;
        }
        cpuUsage = Math.round(cpuUsage / cpus.length);

        const processMemory = process.memoryUsage();
        const heapUsed = Math.round(processMemory.heapUsed / 1024 / 1024);
        const heapTotal = Math.round(processMemory.heapTotal / 1024 / 1024);
        const external = Math.round(processMemory.external / 1024 / 1024);

        return {
            memoryPercent,
            usedMemory: Math.round(usedMemory / 1024 / 1024),
            totalMemory: Math.round(totalMemory / 1024 / 1024),
            cpuUsage,
            heapUsed,
            heapTotal,
            external,
            platform: os.platform(),
            nodeVersion: process.version,
            cpuModel: cpus[0]?.model || 'Unknown'
        };
    }

    getHealthStatus(stats) {
        const emoji = require('./emoji');
        
        if (stats.cpuUsage > 90 || stats.memoryPercent > 90) {
            return { 
                status: '🔴 CRITICAL', 
                color: emoji.color_error, 
                emoji: emoji.offline,
                level: 'critical'
            };
        }
        if (stats.cpuUsage > 80 || stats.memoryPercent > 80) {
            return { 
                status: '🟡 WARNING', 
                color: emoji.color_warning, 
                emoji: '⚠️',
                level: 'warning'
            };
        }
        if (stats.cpuUsage > 65 || stats.memoryPercent > 65) {
            return { 
                status: '🟠 FAIR', 
                color: 0xFFA500, 
                emoji: '🟠',
                level: 'fair'
            };
        }
        return { 
            status: '🟢 OPTIMAL', 
            color: emoji.color_success, 
            emoji: emoji.online,
            level: 'healthy'
        };
    }

    createProgressBar(value, max = 100, length = 10) {
        const filled = Math.round((value / max) * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    getStatusMessage(health) {
        const messages = {
            critical: ['🚨 SYSTEM CRITICAL - Immediate attention required!', '⛔ Critical resource usage detected!', '🆘 System under heavy load!'],
            warning: ['⚠️ System warning - Resources elevated', '🟡 Monitor system performance', '⚡ High resource usage detected'],
            fair: ['📊 System running normally', '⚙️ System in working condition', '🔧 System optimizing'],
            healthy: ['✨ System running smoothly', '💚 All systems operational', '🚀 Peak performance', '⭐ Excellent stability']
        };
        const msgs = messages[health.level] || messages.healthy;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }

    createStatusEmbed() {
        const emoji = require('./emoji');
        const uptime = Date.now() - this.startTime;
        const stats = this.getSystemStats();
        const health = this.getHealthStatus(stats);

        const serverCount = this.client.guilds?.cache?.size || 0;
        const userCount = this.client.guilds?.cache?.reduce((a, g) => a + g.memberCount, 0) || 0;
        const channelCount = this.client.channels?.cache?.size || 0;
        const ping = this.client.ws.ping;

        const now = Date.now();
        const timeSinceLastCheck = now - this.lastCheck;
        this.lastCheck = now;

        const statusMessage = this.getStatusMessage(health);
        const animationFrame = Math.floor((now / 500) % 4);
        const spinners = ['⠋', '⠙', '⠹', '⠸'];

        const embed = new EmbedBuilder()
            .setTitle(`${spinners[animationFrame]} ⚡ REAL-TIME BOT MONITOR ${spinners[animationFrame]}`)
            .setDescription(`\`\`\`${statusMessage}\nLive Update: ${new Date().toLocaleTimeString()}\`\`\``)
            .setColor(health.color)
            .setThumbnail(this.client.user?.displayAvatarURL())
            .addFields(
                // === SYSTEM HEALTH ===
                {
                    name: `${emoji.status} System Health Status`,
                    value: `${health.emoji} **${health.status}**\nOverall: ${this.createProgressBar(100 - health.level !== 'critical' ? health.level !== 'warning' ? health.level !== 'fair' ? 95 : 60 : 40 : 10)}`,
                    inline: false
                },
                // === UPTIME & LATENCY ===
                {
                    name: `${emoji.uptime} Server Uptime`,
                    value: `\`${this.formatUptime(uptime)}\``,
                    inline: true
                },
                {
                    name: `${emoji.lightning} Discord API Latency`,
                    value: `\`${ping}ms\``,
                    inline: true
                },
                {
                    name: `${emoji.timer} Check Interval`,
                    value: `\`${timeSinceLastCheck}ms\``,
                    inline: true
                },
                // === CPU & MEMORY ===
                {
                    name: `${emoji.cpu} CPU Usage`,
                    value: `\`${stats.cpuUsage}%\` ${this.createProgressBar(stats.cpuUsage)}\n**Model:** ${stats.cpuModel}`,
                    inline: true
                },
                {
                    name: `${emoji.ram} RAM Usage (System)`,
                    value: `\`${stats.memoryPercent}%\` ${this.createProgressBar(stats.memoryPercent)}\n**Used:** ${stats.usedMemory}/${stats.totalMemory} MB`,
                    inline: true
                },
                {
                    name: `${emoji.ram} Heap Memory (Process)`,
                    value: `\`${((stats.heapUsed / stats.heapTotal) * 100).toFixed(1)}%\`\n**${stats.heapUsed}/${stats.heapTotal} MB** + ${stats.external}MB external`,
                    inline: true
                },
                // === NETWORK & CONNECTIONS ===
                {
                    name: `${emoji.server} Servers Connected`,
                    value: `\`${serverCount}\` servers`,
                    inline: true
                },
                {
                    name: `${emoji.people} Total Users`,
                    value: `\`${userCount.toLocaleString()}\` members`,
                    inline: true
                },
                {
                    name: `${emoji.members} Total Channels`,
                    value: `\`${channelCount}\` channels`,
                    inline: true
                },
                // === PLATFORM INFO ===
                {
                    name: `${emoji.settings} Environment`,
                    value: `**Node.js:** \`${stats.nodeVersion}\`\n**OS:** \`${stats.platform.toUpperCase()}\`\n**PID:** \`${process.pid}\``,
                    inline: false
                }
            )
            .setFooter({ 
                text: `🤖 KURO Bot • 24/7 Wispbyte Hosting • Auto-Updating Every 30s`, 
                iconURL: this.client.user?.displayAvatarURL() 
            })
            .setTimestamp();

        return embed;
    }

    async sendOrUpdateStatus() {
        if (!this.enabled) return;

        try {
            const embed = this.createStatusEmbed();
            const payload = { 
                embeds: [embed],
                content: '**🔔 Bot Status Dashboard**'
            };

            if (this.messageId) {
                const response = await fetch(`${this.webhookUrl}/messages/${this.messageId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    this.messageId = null;
                    await this.sendNewMessage(payload);
                }
            } else {
                await this.sendNewMessage(payload);
            }
        } catch (error) {
            console.error('Status webhook error:', error.message);
        }
    }

    async sendNewMessage(payload) {
        try {
            const response = await fetch(`${this.webhookUrl}?wait=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                this.messageId = data.id;
                const emoji = require('./emoji');
                console.log(`${emoji.success} Status webhook message created`);
            }
        } catch (error) {
            console.error('Failed to send status message:', error.message);
        }
    }

    start(intervalMs = 10000) {
        if (!this.enabled) {
            console.log('⚠️ Status webhook not configured');
            return;
        }

        this.sendOrUpdateStatus();

        this.intervalId = setInterval(() => {
            this.sendOrUpdateStatus();
            this.cleanupMemory();
        }, intervalMs);

        // Trigger garbage collection every 10 minutes
        setInterval(() => {
            if (global.gc) global.gc();
            if (this.latencyHistory.length > 100) {
                this.latencyHistory = this.latencyHistory.slice(-100);
            }
        }, 10 * 60 * 1000);

        const emoji = require('./emoji');
        console.log(`${emoji.success} 🔴 REAL-TIME Status webhook started (updating every ${intervalMs / 1000}s)`);
    }

    cleanupMemory() {
        // Limit latency history to prevent memory bloat
        if (this.latencyHistory && this.latencyHistory.length > 100) {
            this.latencyHistory = this.latencyHistory.slice(-100);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            const emoji = require('./emoji');
            console.log(`${emoji.warning} Status webhook stopped`);
        }
    }
}

module.exports = StatusWebhook;
