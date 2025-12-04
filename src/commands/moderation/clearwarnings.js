const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { users, modLogs } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarnings')
        .setDescription('Clear all warnings for a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const optedUser = interaction.options.getUser && interaction.options.getUser('user');
            const targetUser = optedUser || null;
            let target = interaction.options.getMember && interaction.options.getMember('user') || null;
            if (!target && targetUser && interaction.guild) {
                try { target = await interaction.guild.members.fetch(targetUser.id); } catch (e) { target = null; }
            }

            if (!target) {
                return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], flags: 64 });
            }
            
            const userData = await users.get(interaction.guild.id, target.id);
            const warningCount = (userData.warnings || []).length;
            
            if (warningCount === 0) {
                return interaction.reply({ embeds: [errorEmbed('This user has no warnings.')], flags: 64 });
            }
            
            await users.update(interaction.guild.id, target.id, { warnings: [] });
            
            modLogs.add(interaction.guild.id, 'CLEAR_WARNINGS', interaction.user.id, target.id, `Cleared ${warningCount} warnings`);
            
            await interaction.reply({ 
                embeds: [successEmbed(`Cleared ${warningCount} warning(s) from **${target.user.tag}**.`)] 
            });
        } catch (error) {
            console.error(`[Command Error] clearwarnings.js:`, error.message);
            await interaction.reply({
                embeds: [errorEmbed('Error clearing warnings.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
