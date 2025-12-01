const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAutoRefreshStatus } = require('../../utils/autoDeploy');

const emoji = require('../../utils/emoji');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('autosync')
        .setDescription('Shows auto-refresh status for slash commands'),
    
    async execute(interaction, client) {
        try {
            const status = getAutoRefreshStatus();
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.settings} Auto-Refresh Status`)
                .setColor(0x0099FF)
                .setTimestamp()
                .addFields(
                    {
                        name: `${emoji.refresh} Status`,
                        value: status.lastRefresh ? `${emoji.success} Active` : `${emoji.pending} Pending`,
                        inline: true
                    },
                    {
                        name: `${emoji.status} Total Syncs`,
                        value: String(status.totalRefreshes),
                        inline: true
                    },
                    {
                        name: `${emoji.timer} Last Refresh`,
                        value: status.lastRefresh 
                            ? `<t:${Math.floor(status.lastRefresh.getTime() / 1000)}:R>` 
                            : 'Never',
                        inline: true
                    },
                    {
                        name: `${emoji.info} Info`,
                        value: 'Commands sync automatically every hour (3600 seconds)',
                        inline: false
                    }
                );
            
            if (client.webhookLogger && client.webhookLogger.enabled) {
                await client.webhookLogger.sendInfo('Auto-Sync Status Checked', 'User checked auto-refresh status', {
                    info: `Total syncs: ${status.totalRefreshes}`
                });
            }
            
            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            console.error('Error in autosync command:', error);
            
            if (client.webhookLogger && client.webhookLogger.enabled) {
                await client.webhookLogger.sendError('Auto-Sync Command Error', error.message, {
                    commandName: 'autosync',
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    stack: error.stack
                });
            }
            
            await interaction.reply({
                content: `${emoji.error} Failed to retrieve auto-refresh status`,
                flags: 64
            }).catch(() => {});
        }
    }
};
