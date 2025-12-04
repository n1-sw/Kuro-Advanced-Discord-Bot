const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const emoji = require('../../utils/emoji');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('console')
        .setDescription('View the bot console with live statistics')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const client = interaction.client;
            
            const botUptime = client.uptime || 0;
            const days = Math.floor(botUptime / 86400000);
            const hours = Math.floor((botUptime % 86400000) / 3600000);
            const minutes = Math.floor((botUptime % 3600000) / 60000);
            const seconds = Math.floor((botUptime % 60000) / 1000);
            
            const uptimeStr = days > 0 
                ? `${days}d ${hours}h ${minutes}m ${seconds}s` 
                : hours > 0 
                    ? `${hours}h ${minutes}m ${seconds}s`
                    : `${minutes}m ${seconds}s`;
            
            const memUsage = process.memoryUsage();
            const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
            const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
            const rss = Math.round(memUsage.rss / 1024 / 1024);
            
            const cpuUsage = os.loadavg()[0].toFixed(2);
            const totalMem = Math.round(os.totalmem() / 1024 / 1024);
            const freeMem = Math.round(os.freemem() / 1024 / 1024);
            const usedMem = totalMem - freeMem;
            const memPercent = Math.round((usedMem / totalMem) * 100);
            
            const serverCount = client.guilds.cache.size;
            const userCount = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
            const channelCount = client.channels.cache.size;
            const commandCount = client.commands ? client.commands.size : 0;
            
            const healthStatus = memPercent > 90 
                ? `${emoji.error} Critical` 
                : memPercent > 70 
                    ? `${emoji.warning} Warning` 
                    : `${emoji.success} Healthy`;
            
            const statusColor = memPercent > 90 
                ? emoji.color_error 
                : memPercent > 70 
                    ? emoji.color_warning 
                    : emoji.color_success;
            
            const consoleOutput = [
                '```ansi',
                `\u001b[1;32m[SYSTEM]\u001b[0m ${client.user.tag} - Console`,
                `\u001b[1;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m`,
                '',
                `\u001b[1;33m[UPTIME]\u001b[0m`,
                `  Bot Uptime: ${uptimeStr}`,
                '',
                `\u001b[1;33m[BOT STATS]\u001b[0m`,
                `  Servers:    ${serverCount.toLocaleString()}`,
                `  Users:      ${userCount.toLocaleString()}`,
                `  Channels:   ${channelCount.toLocaleString()}`,
                `  Commands:   ${commandCount}`,
                `  Ping:       ${client.ws.ping}ms`,
                '',
                `\u001b[1;33m[SYSTEM RESOURCES]\u001b[0m`,
                `  Heap:    ${heapUsed}MB / ${heapTotal}MB`,
                `  RSS:     ${rss}MB`,
                `  RAM:     ${Math.round(usedMem / 1024)}GB / ${Math.round(totalMem / 1024)}GB (${memPercent}%)`,
                `  CPU:     ${cpuUsage}%`,
                '',
                `\u001b[1;33m[ENVIRONMENT]\u001b[0m`,
                `  Node.js:   ${process.version}`,
                `  Platform:  ${os.platform()} ${os.arch()}`,
                `  Hostname:  ${os.hostname()}`,
                '',
                `\u001b[1;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m`,
                `\u001b[1;32m[STATUS]\u001b[0m ${healthStatus.replace(/[^\w\s]/g, '')}`,
                '```'
            ].join('\n');
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.console} Bot Console`)
                .setDescription(consoleOutput)
                .setColor(statusColor)
                .addFields(
                    { 
                        name: `${emoji.uptime} Real Uptime`, 
                        value: `\`${uptimeStr}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.health} Health`, 
                        value: healthStatus, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.zap} Ping`, 
                        value: `\`${client.ws.ping}ms\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Requested by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] console.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to get console information.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
