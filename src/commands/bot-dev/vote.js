const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Vote for the bot on top.gg'),
    
    async execute(interaction) {
        try {
            const botId = interaction.client.user.id;
            const topggLink = `https://top.gg/bot/${botId}`;
            
            const embed = createEmbed({
                title: `${emoji.star} Vote for the Bot`,
                description: 'Help us grow by voting on top.gg! Every vote supports the development of this bot.',
                color: 0xFFD700,
                fields: [
                    { name: 'Voting Benefits', value: '• Helps the bot grow\n• Supports development\n• Earns you recognition\n• Direct your support to us', inline: false },
                    { name: 'Vote Every 12 Hours', value: 'You can vote once every 12 hours to continuously support the bot!', inline: false }
                ]
            });
            
            const voteButton = new ButtonBuilder()
                .setLabel('Vote on top.gg')
                .setStyle(ButtonStyle.Link)
                .setURL(topggLink);
            
            const row = new ActionRowBuilder().addComponents(voteButton);
            
            await interaction.reply({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error(`[Command Error] vote.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error getting vote link.', flags: 64 }).catch(() => {});
            }
        }
    }
};
