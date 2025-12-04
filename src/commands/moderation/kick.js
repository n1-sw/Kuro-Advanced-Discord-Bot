const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { modLogs } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    async execute(interaction) {
        const optedUser = interaction.options.getUser && interaction.options.getUser('user');
        const targetUser = optedUser || null;
        let target = interaction.options.getMember && interaction.options.getMember('user') || null;
        if (!target && targetUser && interaction.guild) {
            try { target = await interaction.guild.members.fetch(targetUser.id); } catch (e) { target = null; }
        }

        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], flags: 64 });
        }
        
        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed('You cannot kick yourself.')], flags: 64 });
        }
        
        if (!target.kickable) {
            return interaction.reply({ embeds: [errorEmbed('I cannot kick this user. They may have higher permissions.')], flags: 64 });
        }
        
        try {
            await target.kick(`${reason} | Kicked by ${interaction.user.tag}`);
            
            modLogs.add(interaction.guild.id, 'KICK', interaction.user.id, target.id, reason);
            
            await interaction.reply({ 
                embeds: [successEmbed(`**${target.user.tag}** has been kicked.\nReason: ${reason}`)] 
            });
        } catch (error) {
            console.error(`[Command Error] kick.js:`, error.message);
            await interaction.reply({ embeds: [errorEmbed('Failed to kick the user.')], flags: 64 });
        }
    }
};
