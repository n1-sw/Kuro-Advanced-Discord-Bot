const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelinfo')
        .setDescription('View information about a channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to get information about (defaults to current channel)')),
    
    async execute(interaction) {
        try {
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            
            const channelTypes = {
                [ChannelType.GuildText]: 'Text Channel',
                [ChannelType.GuildVoice]: 'Voice Channel',
                [ChannelType.GuildCategory]: 'Category',
                [ChannelType.GuildAnnouncement]: 'Announcement Channel',
                [ChannelType.GuildStageVoice]: 'Stage Channel',
                [ChannelType.GuildForum]: 'Forum Channel',
                [ChannelType.PublicThread]: 'Public Thread',
                [ChannelType.PrivateThread]: 'Private Thread',
                [ChannelType.AnnouncementThread]: 'Announcement Thread'
            };
            
            const channelType = channelTypes[channel.type] || 'Unknown';
            
            const fields = [
                { 
                    name: `${emoji.channel} Channel Name`, 
                    value: `\`${channel.name}\``, 
                    inline: true 
                },
                { 
                    name: `${emoji.id} Channel ID`, 
                    value: `\`${channel.id}\``, 
                    inline: true 
                },
                { 
                    name: `${emoji.gear} Type`, 
                    value: `\`${channelType}\``, 
                    inline: true 
                },
                { 
                    name: `${emoji.calendar} Created`, 
                    value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, 
                    inline: true 
                }
            ];
            
            if (channel.parent) {
                fields.push({ 
                    name: `${emoji.list} Category`, 
                    value: `\`${channel.parent.name}\``, 
                    inline: true 
                });
            }
            
            if (channel.position !== undefined) {
                fields.push({ 
                    name: `${emoji.chart} Position`, 
                    value: `\`${channel.position}\``, 
                    inline: true 
                });
            }
            
            if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
                if (channel.topic) {
                    fields.push({ 
                        name: `${emoji.document} Topic`, 
                        value: channel.topic.substring(0, 1024), 
                        inline: false 
                    });
                }
                
                fields.push({ 
                    name: `${emoji.timer} Slowmode`, 
                    value: channel.rateLimitPerUser 
                        ? `\`${channel.rateLimitPerUser}s\`` 
                        : 'Disabled', 
                    inline: true 
                });
                
                fields.push({ 
                    name: `${emoji.lock} NSFW`, 
                    value: channel.nsfw ? `${emoji.success} Yes` : `${emoji.error} No`, 
                    inline: true 
                });
            }
            
            if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
                fields.push({ 
                    name: `${emoji.people} User Limit`, 
                    value: channel.userLimit ? `\`${channel.userLimit}\`` : 'Unlimited', 
                    inline: true 
                });
                
                fields.push({ 
                    name: `${emoji.megaphone} Bitrate`, 
                    value: `\`${channel.bitrate / 1000}kbps\``, 
                    inline: true 
                });
                
                if (channel.members) {
                    fields.push({ 
                        name: `${emoji.online} Connected`, 
                        value: `\`${channel.members.size}\` users`, 
                        inline: true 
                    });
                }
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.channel} Channel Information`)
                .setColor(emoji.color_info)
                .addFields(fields)
                .setFooter({ 
                    text: `Requested by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] channelinfo.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to get channel information.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
