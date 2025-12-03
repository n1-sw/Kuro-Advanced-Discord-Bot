const { SlashCommandBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency and response time'),
    
    async execute(interaction) {
        try {
            await interaction.reply({ content: `${emoji.pending} Calculating...` });
            const msg = await interaction.fetchReply();
            const ping = msg.createdTimestamp - interaction.createdTimestamp;
            const apiPing = interaction.client.ws.ping;
            
            let statusText;
            if (ping < 100 && apiPing < 100) {
                statusText = 'Excellent';
            } else if (ping < 200 && apiPing < 200) {
                statusText = 'Good';
            } else {
                statusText = 'High Latency';
            }
            
            const rawQuality = Math.floor((500 - (ping + apiPing)) / 5);
            const qualityPercent = Math.max(0, Math.min(100, rawQuality));
            const filled = Math.max(0, Math.min(10, Math.floor(qualityPercent / 10)));
            const bar = `${'█'.repeat(filled)}${'░'.repeat(10 - filled)}`;
            
            const embed = AdvancedEmbed.stats(`⚡ Network Performance`, {
                '🔴 Bot Response': `${ping}ms`,
                '🌐 Discord API': `${apiPing}ms`,
                '📊 Connection': statusText,
                '⏱️ Average': `${Math.round((ping + apiPing) / 2)}ms`
            }, ping < 100 ? emoji.color_success : emoji.color_warning)
            .setDescription(`**Connection Quality:**\n\`${bar}\` ${qualityPercent}%`);
            
            await interaction.editReply({ content: null, embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] ping.js:`, error.message);
            const embed = AdvancedEmbed.commandError('Network Diagnostics Failed', 'Could not calculate ping');
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {});
            }
        }
    }
};
