const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, formatDuration } = require('../../utils/helpers');
const { modLogs } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 10m, 1h, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const optedUser = interaction.options.getUser && interaction.options.getUser('user');
        const targetUser = optedUser || null;
        let target = interaction.options.getMember && interaction.options.getMember('user') || null;
        if (!target && targetUser && interaction.guild) {
            try { target = await interaction.guild.members.fetch(targetUser.id); } catch (e) { target = null; }
        }
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], flags: 64 });
        }
        
        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed('You cannot mute yourself.')], flags: 64 });
        }
        
        if (!target.moderatable) {
            return interaction.reply({ embeds: [errorEmbed('I cannot mute this user. They may have higher permissions.')], flags: 64 });
        }
        
        const duration = parseDuration(durationStr);
        if (!duration) {
            return interaction.reply({ embeds: [errorEmbed('Invalid duration format. Use: 10s, 5m, 1h, 1d')], flags: 64 });
        }
        
        if (duration > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({ embeds: [errorEmbed('Maximum timeout duration is 28 days.')], flags: 64 });
        }
        
        try {
            await target.timeout(duration, `${reason} | Muted by ${interaction.user.tag}`);
            
            modLogs.add(interaction.guild.id, 'MUTE', interaction.user.id, target.id, `${reason} (${formatDuration(duration)})`);
            
            await interaction.reply({ 
                embeds: [successEmbed(`**${target.user.tag}** has been muted for ${formatDuration(duration)}.\nReason: ${reason}`)] 
            });
        } catch (error) {
            console.error(`[Command Error] mute.js:`, error.message);
            await interaction.reply({ embeds: [errorEmbed('Failed to mute the user.')], flags: 64 });
        }
    }
};

function parseDuration(timeStr) {
    const regex = /^(\d+)(s|m|h|d)$/;
    const match = timeStr.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}
