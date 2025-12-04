const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('countdown')
        .setDescription('Start a countdown timer')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Number of seconds to count down (max 60)')
                .setRequired(true)
                .setMinValue(3)
                .setMaxValue(60))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to display when countdown ends')),
    
    async execute(interaction) {
        try {
            const seconds = interaction.options.getInteger('seconds');
            const endMessage = interaction.options.getString('message') || 'Time\'s up!';
            
            const createEmbed = (remaining) => {
                const progress = Math.round(((seconds - remaining) / seconds) * 10);
                const bar = '█'.repeat(progress) + '░'.repeat(10 - progress);
                
                return new EmbedBuilder()
                    .setTitle(`${emoji.timer} Countdown`)
                    .setDescription(
                        `**${remaining}** seconds remaining\n\n` +
                        `\`${bar}\` ${Math.round(((seconds - remaining) / seconds) * 100)}%`
                    )
                    .setColor(remaining <= 3 ? emoji.color_error : remaining <= 10 ? emoji.color_warning : emoji.color_info)
                    .setFooter({ 
                        text: `Started by ${interaction.user.username}`, 
                        iconURL: interaction.user.displayAvatarURL() 
                    });
            };
            
            const response = await interaction.reply({ 
                embeds: [createEmbed(seconds)], 
                fetchReply: true 
            });
            
            let remaining = seconds;
            
            const interval = setInterval(async () => {
                remaining--;
                
                if (remaining <= 0) {
                    clearInterval(interval);
                    
                    const finalEmbed = new EmbedBuilder()
                        .setTitle(`${emoji.party} Countdown Complete!`)
                        .setDescription(`**${endMessage}**`)
                        .setColor(emoji.color_success)
                        .setFooter({ 
                            text: `Started by ${interaction.user.username}`, 
                            iconURL: interaction.user.displayAvatarURL() 
                        })
                        .setTimestamp();
                    
                    await response.edit({ embeds: [finalEmbed] }).catch(() => {});
                } else {
                    await response.edit({ embeds: [createEmbed(remaining)] }).catch(() => {});
                }
            }, 1000);
        } catch (error) {
            console.error(`[Command Error] countdown.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to start countdown.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
