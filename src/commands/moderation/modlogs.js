const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const { modLogs } = require('../../utils/database');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modlogs')
        .setDescription('View moderation logs')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Filter logs by user (optional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction, client) {
        try {
            if (!interaction.guild) {
                return interaction.reply({ content: `${emoji.error || '❌'} This command can only be used in a server.`, flags: 64 }).catch(() => {});
            }

            const target = interaction.options.getMember('user');
            
            let logs = [];
            let title = 'Recent Moderation Logs';
            
            try {
                if (target) {
                    logs = modLogs?.getByUser?.(interaction.guild.id, target.id, 10) || [];
                    title = `Moderation Logs for ${target.user?.tag || target.id}`;
                } else {
                    logs = modLogs?.get?.(interaction.guild.id, 10) || [];
                }
            } catch (e) {
                logs = [];
            }
            
            if (!logs || logs.length === 0) {
                const emptyEmbed = createEmbed({
                    title,
                    description: 'No moderation logs found.',
                    color: 0x00ff00
                }) || new (require('discord.js').EmbedBuilder)().setTitle(title).setDescription('No logs');
                
                return interaction.reply({ embeds: [emptyEmbed] }).catch(() => {
                    interaction.reply({ content: `${emoji.list || '📋'} No moderation logs found.` });
                });
            }
            
            const logList = await Promise.all(
                logs.map(async (log) => {
                    try {
                        const date = log?.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'Unknown date';
                        let moderator = 'Unknown';
                        let targetUser = 'Unknown';
                        
                        if (log?.moderatorId && client?.users) {
                            try {
                                const modUser = await client.users.fetch(log.moderatorId).catch(() => null);
                                if (modUser?.tag) moderator = modUser.tag;
                            } catch (e) {}
                        }
                        
                        if (log?.targetId && client?.users) {
                            try {
                                const tgtUser = await client.users.fetch(log.targetId).catch(() => null);
                                if (tgtUser?.tag) targetUser = tgtUser.tag;
                            } catch (e) {}
                        }
                        
                        return `**${log?.action || 'Action'}** | ${date}\nMod: ${moderator} | Target: ${targetUser}\nReason: ${log?.reason || 'No reason'}`;
                    } catch (e) {
                        return `**Moderation Log** | Unable to read full details`;
                    }
                })
            );
            
            const logsEmbed = createEmbed({
                title,
                description: logList.join('\n\n') || 'Unable to load logs',
                color: 0x0099ff,
                footer: `Showing last ${logs.length || 0} logs`
            }) || new (require('discord.js').EmbedBuilder)()
                .setTitle(title)
                .setDescription(`${logs.length} logs found`)
                .setColor(0x0099ff);
            
            await interaction.reply({ embeds: [logsEmbed] }).catch(() => {
                interaction.reply({ content: `${emoji.list || '📋'} Found ${logs.length} moderation logs` });
            });
        } catch (error) {
            console.error('[modlogs.js]', error.message);
            const errorEmbed = AdvancedEmbed.commandError?.('Moderation Logs Error', error.message || 'Error loading logs') || new (require('discord.js').EmbedBuilder)().setTitle('Error').setDescription('Failed to load logs');
            
            if (!interaction.replied) {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 }).catch(() => {
                    interaction.reply({ content: '❌ Error loading moderation logs.', flags: 64 });
                });
            }
        }
    }
};
