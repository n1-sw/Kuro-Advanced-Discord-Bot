const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');
const { users, gameStats } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View bot statistics and analytics'),
    
    async execute(interaction) {
        try {
            const client = interaction.client;
            
            const serverCount = client.guilds.cache.size;
            const userCount = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
            const channelCount = client.channels.cache.size;
            const commandCount = client.commands ? client.commands.size : 0;
            
            let emojiStats = { totalEmojis: 0, animatedEmojis: 0, staticEmojis: 0 };
            if (client.emojiManager) {
                emojiStats = client.emojiManager.getStats();
            } else {
                let totalEmojis = 0;
                let animatedEmojis = 0;
                client.guilds.cache.forEach(guild => {
                    guild.emojis.cache.forEach(e => {
                        totalEmojis++;
                        if (e.animated) animatedEmojis++;
                    });
                });
                emojiStats = {
                    totalEmojis,
                    animatedEmojis,
                    staticEmojis: totalEmojis - animatedEmojis
                };
            }
            
            const uptime = client.uptime || 0;
            const days = Math.floor(uptime / 86400000);
            const hours = Math.floor((uptime % 86400000) / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const uptimeStr = days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
            
            const textChannels = client.channels.cache.filter(c => c.type === 0).size;
            const voiceChannels = client.channels.cache.filter(c => c.type === 2).size;
            const categoryChannels = client.channels.cache.filter(c => c.type === 4).size;
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.chart} Bot Statistics`)
                .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                .setColor(emoji.color_info)
                .addFields(
                    { 
                        name: `${emoji.server} Servers`, 
                        value: `\`${serverCount.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.people} Users`, 
                        value: `\`${userCount.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.channel} Channels`, 
                        value: `\`${channelCount.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.gear} Commands`, 
                        value: `\`${commandCount}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.uptime} Uptime`, 
                        value: `\`${uptimeStr}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.zap} Ping`, 
                        value: `\`${client.ws.ping}ms\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.sparkles} Emojis Available`, 
                        value: `\`${emojiStats.totalEmojis}\` (${emojiStats.animatedEmojis} animated)`, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.messages} Text Channels`, 
                        value: `\`${textChannels}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.megaphone} Voice Channels`, 
                        value: `\`${voiceChannels}\``, 
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
            console.error(`[Command Error] stats.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to get statistics.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
