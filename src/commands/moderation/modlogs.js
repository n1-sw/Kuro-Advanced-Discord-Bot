const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const { modLogs } = require('../../utils/database');
const emoji = require('../../utils/emoji');

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
                return interaction.reply({ content: `${emoji.error} This command can only be used in a server.`, flags: 64 }).catch(() => {});
            }

            const target = interaction.options.getMember('user');
            
            let logs;
            let title;
            
            if (target) {
                logs = modLogs.getByUser(interaction.guild.id, target.id, 10);
                title = `Moderation Logs for ${target.user.tag}`;
            } else {
                logs = modLogs.get(interaction.guild.id, 10);
                title = 'Recent Moderation Logs';
            }
            
            if (logs.length === 0) {
                return interaction.reply({ embeds: [createEmbed({
                    title,
                    description: 'No moderation logs found.',
                    color: 0x00ff00
                })] });
            }
            
            const logList = await Promise.all(logs.map(async (log) => {
                const date = new Date(log.timestamp).toLocaleDateString();
                let moderator = 'Unknown';
                let targetUser = 'Unknown';
                
                try {
                    const modUser = await client.users.fetch(log.moderatorId);
                    moderator = modUser.tag;
                } catch (e) {}
                
                try {
                    const tgtUser = await client.users.fetch(log.targetId);
                    targetUser = tgtUser.tag;
                } catch (e) {}
                
                return `**${log.action}** | ${date}\nMod: ${moderator} | Target: ${targetUser}\nReason: ${log.reason}`;
            }));
            
            const embed = createEmbed({
                title,
                description: logList.join('\n\n'),
                color: 0x0099ff,
                footer: `Showing last ${logs.length} logs`
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Modlogs command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error loading moderation logs.', flags: 64 }).catch(() => {});
            }
        }
    }
};
