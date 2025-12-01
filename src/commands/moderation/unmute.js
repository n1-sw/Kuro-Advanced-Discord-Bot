const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { modLogs } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove timeout from a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unmute')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const target = interaction.options.getMember('user');
        
        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], flags: 64 });
        }
        
        if (!target.communicationDisabledUntil) {
            return interaction.reply({ embeds: [errorEmbed('This user is not muted.')], flags: 64 });
        }
        
        try {
            await target.timeout(null, `Unmuted by ${interaction.user.tag}`);
            
            modLogs.add(interaction.guild.id, 'UNMUTE', interaction.user.id, target.id, 'Timeout removed');
            
            await interaction.reply({ 
                embeds: [successEmbed(`**${target.user.tag}** has been unmuted.`)] 
            });
        } catch (error) {
            console.error('Unmute error:', error);
            await interaction.reply({ embeds: [errorEmbed('Failed to unmute the user.')], flags: 64 });
        }
    }
};
