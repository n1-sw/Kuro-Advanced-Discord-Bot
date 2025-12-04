const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const emoji = require('../../utils/emoji');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('View detailed information about the bot'),
    
    async execute(interaction) {
        try {
            const client = interaction.client;
            const uptime = client.uptime;
            
            const days = Math.floor(uptime / 86400000);
            const hours = Math.floor((uptime % 86400000) / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);
            
            const uptimeStr = days > 0 
                ? `${days}d ${hours}h ${minutes}m ${seconds}s` 
                : hours > 0 
                    ? `${hours}h ${minutes}m ${seconds}s`
                    : `${minutes}m ${seconds}s`;
            
            const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            const totalChannels = client.channels.cache.size;
            const totalServers = client.guilds.cache.size;
            
            const memUsage = process.memoryUsage();
            const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
            const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
            const rss = Math.round(memUsage.rss / 1024 / 1024);
            
            const cpuUsage = os.loadavg()[0].toFixed(2);
            const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);
            const freeMem = Math.round(os.freemem() / 1024 / 1024 / 1024);
            const usedMem = totalMem - freeMem;
            
            const commandCount = client.commands ? client.commands.size : 0;
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.bot} Bot Information`)
                .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                .setColor(emoji.color_info)
                .addFields(
                    { 
                        name: `${emoji.person} Bot Name`, 
                        value: `\`${client.user.tag}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.id} Bot ID`, 
                        value: `\`${client.user.id}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.calendar} Created`, 
                        value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.uptime} Uptime`, 
                        value: `\`${uptimeStr}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.server} Servers`, 
                        value: `\`${totalServers.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.people} Users`, 
                        value: `\`${totalUsers.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.channel} Channels`, 
                        value: `\`${totalChannels.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.gear} Commands`, 
                        value: `\`${commandCount}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.zap} Ping`, 
                        value: `\`${client.ws.ping}ms\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.ram} Memory Usage`, 
                        value: `\`${heapUsed}MB / ${heapTotal}MB\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.cpu} System Load`, 
                        value: `\`${cpuUsage}%\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.database} System RAM`, 
                        value: `\`${usedMem}GB / ${totalMem}GB\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.gear} Discord.js`, 
                        value: `\`v${version}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.terminal} Node.js`, 
                        value: `\`${process.version}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.server} Platform`, 
                        value: `\`${os.platform()} ${os.arch()}\``, 
                        inline: true 
                    }
                )
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] botinfo.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Error getting bot info.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
