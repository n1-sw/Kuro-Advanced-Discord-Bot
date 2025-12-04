const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { users, modLogs } = require('../../utils/database');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        try {
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
                return interaction.reply({ embeds: [errorEmbed('You cannot warn yourself.')], flags: 64 });
            }
            
            if (target.user.bot) {
                return interaction.reply({ embeds: [errorEmbed('You cannot warn bots.')], flags: 64 });
            }
            
            const userData = await users.get(interaction.guild.id, target.id);
            const newWarnings = [...(userData.warnings || []), {
                reason,
                moderator: interaction.user.id,
                timestamp: Date.now()
            }];
            
            await users.update(interaction.guild.id, target.id, { warnings: newWarnings });
            
            modLogs.add(interaction.guild.id, 'WARN', interaction.user.id, target.id, reason);
            
            const warningCount = newWarnings.length;
            let response = `**${target.user.tag}** has been warned.\nReason: ${reason}\nTotal warnings: ${warningCount}`;
            
            if (warningCount >= config.automod.muteThreshold && target.moderatable) {
                await target.timeout(10 * 60 * 1000, 'Auto-mute: Too many warnings');
                response += '\n\nUser has been auto-muted for 10 minutes due to excessive warnings.';
            }
            
            await interaction.reply({ embeds: [successEmbed(response)] });
            
            try {
                await target.send(`You have been warned in **${interaction.guild.name}**.\nReason: ${reason}\nTotal warnings: ${warningCount}`);
            } catch (e) {}
        } catch (error) {
            console.error(`[Command Error] warn.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ embeds: [errorEmbed('Error warning user.')], flags: 64 }).catch(() => {});
            }
        }
    }
};
