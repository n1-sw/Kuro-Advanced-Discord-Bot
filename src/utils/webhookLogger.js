const { EmbedBuilder } = require('discord.js');
const os = require('os');
const emoji = require('./emoji');

class WebhookLogger {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
        this.enabled = this.validateUrl(webhookUrl);
        
        // Advanced real-time analytics
        this.metrics = {
            commands: new Map(),
            events: new Map(),
            users: new Map(),
            guilds: new Map(),
            errors: new Map(),
            performance: {
                avgPing: 0,
                minPing: Infinity,
                maxPing: 0,
                totalPings: 0,
                responseTimes: [],
                cpuUsage: [],
                memorySnapshots: []
            }
        };
        
        this.activityLog = [];
        this.errorLog = [];
        this.performanceAlerts = [];
        this.userActivityHeatmap = new Map();
        this.commandTrends = new Map();
        this.serverHealth = new Map();
        
        this.startTime = Date.now();
        this.sessionMetrics = {
            totalCommands: 0,
            totalEvents: 0,
            totalMessages: 0,
            totalErrors: 0,
            totalInteractions: 0,
            uniqueUsers: new Set(),
            uniqueGuilds: new Set()
        };
        
        this.reportInterval = 5000;
        
        if (this.enabled) {
            this.startAutoReporting();
        }
    }

    validateUrl(url) {
        if (!url) return false;
        try {
            return url.startsWith('https://discord.com/api/webhooks/1445081240016392374/TA92u-YuvIsd9gkU9P3TttwiQR4WBNy3vwbzwXBkRhnf-LuXqbOkDwliUTroAmLtXGm6');
        } catch {
            return false;
        }
    }

    startAutoReporting() {
        this.reportIntervalId = setInterval(() => {
            this.sendAggregatedReport();
            this.cleanupOldData();
        }, this.reportInterval);
        
        // Trigger garbage collection every 5 minutes to prevent memory bloat
        setInterval(() => {
            if (global.gc) global.gc();
        }, 5 * 60 * 1000);
        
        console.log(`${emoji.success} Advanced analytics engine started (10s intervals)`);
    }
    
    cleanupOldData() {
        // Limit activity logs to last 1000 entries
        if (this.activityLog.length > 1000) {
            this.activityLog = this.activityLog.slice(-1000);
        }
        
        // Limit error logs to last 500 entries
        if (this.errorLog.length > 500) {
            this.errorLog = this.errorLog.slice(-500);
        }
        
        // Limit performance alerts to last 200 entries
        if (this.performanceAlerts.length > 200) {
            this.performanceAlerts = this.performanceAlerts.slice(-200);
        }
        
        // Limit response times history to last 100 entries
        if (this.metrics.performance.responseTimes.length > 100) {
            this.metrics.performance.responseTimes = this.metrics.performance.responseTimes.slice(-100);
        }
        
        // Limit CPU usage history to last 100 entries
        if (this.metrics.performance.cpuUsage.length > 100) {
            this.metrics.performance.cpuUsage = this.metrics.performance.cpuUsage.slice(-100);
        }
        
        // Limit memory snapshots to last 50 entries
        if (this.metrics.performance.memorySnapshots.length > 50) {
            this.metrics.performance.memorySnapshots = this.metrics.performance.memorySnapshots.slice(-50);
        }
    }

    // ===== ADVANCED COMMAND TRACKING =====
    recordCommand(commandName, success = true, executionTime = 0, userId, guildId) {
        this.sessionMetrics.totalCommands++;
        this.sessionMetrics.uniqueUsers.add(userId);
        this.sessionMetrics.uniqueGuilds.add(guildId);

        if (!this.metrics.commands.has(commandName)) {
            this.metrics.commands.set(commandName, {
                total: 0,
                successful: 0,
                failed: 0,
                avgTime: 0,
                maxTime: 0,
                minTime: Infinity,
                users: new Set(),
                lastExecuted: null,
                timings: []
            });
        }

        const cmdStats = this.metrics.commands.get(commandName);
        cmdStats.total++;
        cmdStats.lastExecuted = new Date();
        cmdStats.users.add(userId);
        cmdStats.timings.push(executionTime);

        if (cmdStats.timings.length > 50) cmdStats.timings.shift();
        cmdStats.avgTime = cmdStats.timings.reduce((a, b) => a + b, 0) / cmdStats.timings.length;
        cmdStats.maxTime = Math.max(cmdStats.maxTime, executionTime);
        cmdStats.minTime = Math.min(cmdStats.minTime, executionTime);

        if (success) {
            cmdStats.successful++;
        } else {
            cmdStats.failed++;
        }

        // Detect performance bottlenecks
        if (executionTime > 1000) {
            this.performanceAlerts.push({
                type: 'SLOW_COMMAND',
                command: commandName,
                time: executionTime,
                user: userId,
                guild: guildId,
                timestamp: new Date()
            });
            if (this.performanceAlerts.length > 100) this.performanceAlerts.shift();
        }

        this.recordActivityLog('COMMAND', {
            name: commandName,
            success,
            executionTime,
            userId,
            guildId
        });
    }

    recordEvent(eventName, data = {}) {
        this.sessionMetrics.totalEvents++;
        
        if (!this.metrics.events.has(eventName)) {
            this.metrics.events.set(eventName, {
                total: 0,
                lastOccurred: null,
                frequency: []
            });
        }

        const eventStats = this.metrics.events.get(eventName);
        eventStats.total++;
        eventStats.lastOccurred = new Date();
        eventStats.frequency.push(Date.now());

        if (eventStats.frequency.length > 100) eventStats.frequency.shift();

        this.recordActivityLog('EVENT', { name: eventName, ...data });
    }

    recordMessage(author, content, guildId) {
        this.sessionMetrics.totalMessages++;
        this.sessionMetrics.uniqueUsers.add(author);
        this.sessionMetrics.uniqueGuilds.add(guildId);

        const contentLength = content.length;
        const hasLinks = /(https?:\/\/[^\s]+)/gi.test(content);
        const hasMentions = /@/g.test(content);
        const wordCount = content.split(/\s+/).length;

        if (!this.userActivityHeatmap.has(author)) {
            this.userActivityHeatmap.set(author, { messages: 0, chars: 0, activity: [] });
        }

        const userActivity = this.userActivityHeatmap.get(author);
        userActivity.messages++;
        userActivity.chars += contentLength;
        userActivity.activity.push({ time: Date.now(), length: contentLength });

        if (userActivity.activity.length > 100) userActivity.activity.shift();

        this.recordActivityLog('MESSAGE', {
            author,
            length: contentLength,
            words: wordCount,
            hasLinks,
            hasMentions,
            guildId
        });
    }

    recordInteraction(interactionType, userId, guildId, details = {}) {
        this.sessionMetrics.totalInteractions++;
        this.sessionMetrics.uniqueUsers.add(userId);
        this.sessionMetrics.uniqueGuilds.add(guildId);

        this.recordActivityLog('INTERACTION', {
            type: interactionType,
            userId,
            guildId,
            ...details
        });
    }

    recordPing(ping, guildId) {
        this.metrics.performance.minPing = Math.min(this.metrics.performance.minPing, ping);
        this.metrics.performance.maxPing = Math.max(this.metrics.performance.maxPing, ping);
        this.metrics.performance.totalPings++;
        this.metrics.performance.avgPing = Math.round(
            (this.metrics.performance.avgPing * (this.metrics.performance.totalPings - 1) + ping) / this.metrics.performance.totalPings
        );
        this.metrics.performance.responseTimes.push({ time: ping, timestamp: Date.now() });

        if (this.metrics.performance.responseTimes.length > 100) {
            this.metrics.performance.responseTimes.shift();
        }

        if (!this.serverHealth.has(guildId)) {
            this.serverHealth.set(guildId, { avgPing: 0, pings: [] });
        }

        const health = this.serverHealth.get(guildId);
        health.pings.push(ping);
        health.avgPing = health.pings.reduce((a, b) => a + b, 0) / health.pings.length;

        if (health.pings.length > 50) health.pings.shift();
    }

    recordMemorySnapshot() {
        const memUsage = process.memoryUsage();
        this.metrics.performance.memorySnapshots.push({
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss,
            timestamp: Date.now()
        });

        if (this.metrics.performance.memorySnapshots.length > 100) {
            this.metrics.performance.memorySnapshots.shift();
        }
    }

    recordActivityLog(type, details) {
        this.activityLog.push({
            type,
            details,
            timestamp: new Date()
        });

        if (this.activityLog.length > 200) this.activityLog.shift();
    }

    async sendError(title, message, details = {}) {
        if (!this.enabled) return;

        this.sessionMetrics.totalErrors++;
        
        const errorKey = `${title}:${message}`.substring(0, 50);
        if (!this.metrics.errors.has(errorKey)) {
            this.metrics.errors.set(errorKey, { count: 0, lastOccurred: null, details: [] });
        }

        const errorStats = this.metrics.errors.get(errorKey);
        errorStats.count++;
        errorStats.lastOccurred = new Date();
        errorStats.details.push(details);

        if (errorStats.details.length > 20) errorStats.details.shift();

        this.errorLog.push({
            title,
            message,
            details,
            timestamp: new Date()
        });

        if (this.errorLog.length > 100) this.errorLog.shift();

        try {
            const embed = new EmbedBuilder()
                .setTitle(`🚨 ${title}`)
                .setDescription(message || 'Unknown error')
                .setColor(emoji.color_error)
                .setTimestamp()
                .addFields(
                    { name: `${emoji.error} Error Count`, value: `\`${errorStats.count}\``, inline: true },
                    { name: `${emoji.timer} First Seen`, value: `\`${new Date(errorStats.lastOccurred).toLocaleTimeString()}\``, inline: true },
                    { name: `${emoji.settings} Environment`, value: process.env.NODE_ENV || 'production', inline: true }
                );

            if (details.commandName) {
                embed.addFields({ name: `${emoji.list} Command`, value: `/${details.commandName}`, inline: true });
            }
            if (details.userId) {
                embed.addFields({ name: `${emoji.id} User`, value: `\`${details.userId}\``, inline: true });
            }
            if (details.guildId) {
                embed.addFields({ name: `${emoji.server} Guild`, value: `\`${details.guildId}\``, inline: true });
            }
            if (details.stack) {
                const stackSliced = String(details.stack).substring(0, 1024);
                embed.addFields({ name: `${emoji.document} Stack`, value: `\`\`\`${stackSliced}\`\`\``, inline: false });
            }

            const payload = { embeds: [embed] };

            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {});
        } catch (error) {
            console.error('Failed to send webhook error:', error?.message);
        }
    }

    async sendAggregatedReport() {
        if (!this.enabled) return;

        try {
            this.recordMemorySnapshot();
            const uptime = Date.now() - this.startTime;
            const memUsage = process.memoryUsage();
            const heapPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

            // Get top commands
            const topCommands = Array.from(this.metrics.commands.entries())
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 5)
                .map(([cmd, stats]) => `\`${cmd}\` (${stats.total}x, ${stats.successful}✅)`)
                .join('\n') || 'None';

            // Get performance summary
            const topPerformanceIssues = this.performanceAlerts
                .slice(-5)
                .map(alert => `⚠️ \`${alert.command}\` took \`${alert.time}ms\``)
                .join('\n') || 'Excellent';

            // Get user activity summary
            const activeUsers = this.userActivityHeatmap.size;
            const totalMessages = Array.from(this.userActivityHeatmap.values())
                .reduce((sum, u) => sum + u.messages, 0);

            // Get most active events
            const topEvents = Array.from(this.metrics.events.entries())
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 3)
                .map(([evt, stats]) => `\`${evt}\` (${stats.total}x)`)
                .join('\n') || 'None';

            // Server health check
            const healthyServers = Array.from(this.serverHealth.values())
                .filter(h => h.avgPing < 200).length;
            const totalServers = this.serverHealth.size;

            const embed = new EmbedBuilder()
                .setTitle(`${emoji.health} 📊 Advanced Analytics Report (10s)`)
                .setDescription(`Real-time bot intelligence dashboard`)
                .setColor(emoji.color_success)
                .addFields(
                    { name: `${emoji.status} Session Uptime`, value: `\`${this.formatUptime(uptime)}\``, inline: true },
                    { name: `${emoji.lightning} API Performance`, value: `\`${this.metrics.performance.avgPing}ms\` avg`, inline: true },
                    { name: `${emoji.health} Heap Usage`, value: `\`${heapPercent}%\` used`, inline: true },
                    
                    { name: `${emoji.chart} 📈 Command Analytics`, value: `Total: \`${this.sessionMetrics.totalCommands}\`\n${topCommands}`, inline: true },
                    { name: `${emoji.people} 👥 User Activity`, value: `Active: \`${activeUsers}\` users\nMessages: \`${totalMessages}\``, inline: true },
                    { name: `${emoji.server} 🖥️ Server Health`, value: `\`${healthyServers}/${totalServers}\` servers healthy\nAvg Latency: \`${this.metrics.performance.avgPing}ms\``, inline: true },
                    
                    { name: `${emoji.warning} ⚡ Performance Alerts`, value: topPerformanceIssues, inline: false },
                    { name: `${emoji.list} 🎯 Top Events`, value: topEvents, inline: true },
                    { name: `${emoji.error} 🚨 Error Rate`, value: `Total Errors: \`${this.sessionMetrics.totalErrors}\`\nSessions: \`${this.errorLog.length}\``, inline: true },
                    
                    { name: `${emoji.ram} 💾 Memory Snapshot`, value: `Used: \`${Math.round(memUsage.heapUsed / 1024 / 1024)}MB\` | RSS: \`${Math.round(memUsage.rss / 1024 / 1024)}MB\``, inline: false },
                    { name: `${emoji.chart} 📊 Session Stats`, value: `Commands: \`${this.sessionMetrics.totalCommands}\` | Events: \`${this.sessionMetrics.totalEvents}\` | Messages: \`${this.sessionMetrics.totalMessages}\` | Interactions: \`${this.sessionMetrics.totalInteractions}\``, inline: false }
                )
                .setFooter({ text: `Active Users: ${this.sessionMetrics.uniqueUsers.size} | Active Guilds: ${this.sessionMetrics.uniqueGuilds.size} | Generated: ${new Date().toLocaleTimeString()}` })
                .setTimestamp();

            const payload = { embeds: [embed] };

            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {});
        } catch (error) {
            console.error('Failed to send aggregated report:', error?.message);
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

    stop() {
        if (this.reportIntervalId) {
            clearInterval(this.reportIntervalId);
            console.log(`${emoji.warning} Analytics engine stopped`);
        }
    }
}

module.exports = WebhookLogger;
