const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('membercount')
        .setDescription('View detailed member statistics for this server'),
    
    async execute(interaction) {
        try {
            const guild = interaction.guild;
            
            await guild.members.fetch();
            
            const totalMembers = guild.memberCount;
            const humans = guild.members.cache.filter(m => !m.user.bot).size;
            const bots = guild.members.cache.filter(m => m.user.bot).size;
            
            const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;
            const idle = guild.members.cache.filter(m => m.presence?.status === 'idle').size;
            const dnd = guild.members.cache.filter(m => m.presence?.status === 'dnd').size;
            const offline = guild.members.cache.filter(m => !m.presence || m.presence.status === 'offline').size;
            
            const boostTier = guild.premiumTier;
            const boostCount = guild.premiumSubscriptionCount || 0;
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.people} Member Statistics`)
                .setThumbnail(guild.iconURL({ size: 256 }))
                .setColor(emoji.color_info)
                .addFields(
                    { 
                        name: `${emoji.people} Total Members`, 
                        value: `\`${totalMembers.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.person} Humans`, 
                        value: `\`${humans.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.bot} Bots`, 
                        value: `\`${bots.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.online} Online`, 
                        value: `\`${online.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.idle} Idle`, 
                        value: `\`${idle.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.dnd} Do Not Disturb`, 
                        value: `\`${dnd.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.offline} Offline`, 
                        value: `\`${offline.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.sparkles} Boost Level`, 
                        value: `Tier ${boostTier}`, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.diamond} Boosts`, 
                        value: `\`${boostCount}\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `${guild.name}`, 
                    iconURL: guild.iconURL() 
                })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] membercount.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to get member statistics.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
