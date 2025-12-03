const { SlashCommandBuilder } = require('discord.js');
const { getAutoRefreshStatus } = require('../../utils/autoDeploy');

const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('autosync')
        .setDescription('Shows auto-refresh status for slash commands'),
    
    async execute(interaction, client) {
        try {
            const status = getAutoRefreshStatus() || { enabled: true, interval: 60 };
            
            const embed = AdvancedEmbed.commandSuccess('Auto-Sync Status', 
                `${status.enabled ? emoji.success : emoji.error} ${status.enabled ? 'Enabled' : 'Disabled'}\nInterval: ${status.interval || 60} minutes`
            ) || new (require('discord.js').EmbedBuilder)()
                .setTitle('Auto-Sync Status')
                .setDescription(`${status.enabled ? 'Enabled' : 'Disabled'}`);
            
            await interaction.reply({ embeds: [embed] }).catch(() => {
                interaction.reply({ content: `${emoji.success} Auto-sync is ${status.enabled ? 'enabled' : 'disabled'}`, flags: 64 });
            });
        } catch (error) {
            console.error(`[autosync.js]`, error.message);
            
            if (client?.webhookLogger?.enabled) {
                await client.webhookLogger.sendError('Auto-Sync Command Error', error.message, {
                    commandName: 'autosync',
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    stack: error.stack
                }).catch(() => {});
            }
            
            await interaction.reply({
                content: `${emoji.error} Failed to retrieve auto-refresh status`,
                flags: 64
            }).catch(() => {});
        }
    }
};
