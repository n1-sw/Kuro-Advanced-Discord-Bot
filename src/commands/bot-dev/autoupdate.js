const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/helpers');
const { autoDeployCommands } = require('../../utils/autoDeploy');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoupdate')
        .setDescription('Manage auto-refresh mode for slash commands')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action to perform')
                .setRequired(true)
                .addChoices(
                    { name: 'status', value: 'status' },
                    { name: 'deploy-now', value: 'deploy-now' }
                )),
    
    async execute(interaction) {
        try {
            const action = interaction.options.getString('action');
            
            if (action === 'status') {
                const client = interaction.client;
                const isEnabled = client.autoDeployEnabled === true;
                
                return await interaction.reply({
                    embeds: [createEmbed({
                        title: `${emoji.refresh} Auto-Update Status`,
                        color: isEnabled ? 0x00FF00 : 0xFF0000,
                        fields: [
                            { name: 'Status', value: isEnabled ? `${emoji.success} Enabled` : `${emoji.error} Disabled`, inline: true },
                            { name: 'Schedule', value: isEnabled ? 'Every hour' : 'Disabled', inline: true },
                            { name: 'Commands Loaded', value: `${client.commands.size || 0}/35`, inline: true },
                            { name: 'Last Sync', value: 'On startup', inline: false },
                            { name: 'Auto-Deploy Info', value: 'Commands auto-sync with Discord on bot start and hourly', inline: false }
                        ]
                    })]
                });
            }
            
            if (action === 'deploy-now') {
                await interaction.deferReply();
                
                const token = process.env.DISCORD_BOT_TOKEN || process.env.TOKEN;
                const clientId = process.env.CLIENT_ID;
                
                if (!token || !clientId) {
                    return await interaction.editReply({
                        embeds: [errorEmbed(`${emoji.error} Missing DISCORD_BOT_TOKEN or CLIENT_ID\n\nSet these in your environment variables first.`)]
                    });
                }
                
                const success = await autoDeployCommands(token, clientId, { silent: true });
                
                if (success) {
                    return await interaction.editReply({
                        embeds: [successEmbed(
                            `${emoji.success} **Commands Deployed Successfully**\n\n` +
                            `All ${interaction.client.commands.size || 35} commands have been synced with Discord!\n\n` +
                            `They should appear in "/" autocomplete within seconds.`
                        )]
                    });
                } else {
                    return await interaction.editReply({
                        embeds: [errorEmbed(
                            `${emoji.error} **Deployment Failed**\n\nCheck that your bot token and client ID are valid.`
                        )]
                    });
                }
            }
            
        } catch (error) {
            console.error(`[Command Error] autoupdate.js:`, error.message);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        embeds: [errorEmbed('Error processing auto-update command.')],
                        flags: 64
                    });
                } else if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({
                        embeds: [errorEmbed('Error processing auto-update command.')]
                    });
                }
            } catch (e) {
            }
        }
    }
};
