const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { modLogs } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], flags: 64 });
        }
        
        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed('You cannot ban yourself.')], flags: 64 });
        }
        
        if (!target.bannable) {
            return interaction.reply({ embeds: [errorEmbed('I cannot ban this user. They may have higher permissions.')], flags: 64 });
        }
        
        try {
            await target.ban({ reason: `${reason} | Banned by ${interaction.user.tag}` });
            
            modLogs.add(interaction.guild.id, 'BAN', interaction.user.id, target.id, reason);
            
            await interaction.reply({ 
                embeds: [successEmbed(`**${target.user.tag}** has been banned.\nReason: ${reason}`)] 
            });
        } catch (error) {
            console.error('Ban error:', error);
            await interaction.reply({ embeds: [errorEmbed('Failed to ban the user.')], flags: 64 });
        }
    }
};
