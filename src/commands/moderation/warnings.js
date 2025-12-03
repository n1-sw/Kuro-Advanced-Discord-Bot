const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed, errorEmbed } = require('../../utils/helpers');
const { users } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check (leave empty for yourself)')
                .setRequired(false)),
    
    async execute(interaction) {
        try {
            const target = interaction.options.getMember('user') || interaction.member;
            
            if (target.id !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ embeds: [createEmbed({
                    description: 'You can only view your own warnings.',
                    color: 0xff0000
                })], flags: 64 });
            }
            
            const userData = await users.get(interaction.guild.id, target.id);
            const warnings = userData.warnings || [];
            
            if (warnings.length === 0) {
                return interaction.reply({ embeds: [createEmbed({
                    title: `Warnings for ${target.user.tag}`,
                    description: 'No warnings found.',
                    color: 0x00ff00
                })] });
            }
            
            const warningList = warnings.slice(-10).map((warn, index) => {
                const date = new Date(warn.timestamp).toLocaleDateString();
                return `**${index + 1}.** ${warn.reason}\n   *${date}*`;
            }).join('\n\n');
            
            const embed = createEmbed({
                title: `Warnings for ${target.user.tag}`,
                description: warningList,
                color: 0xff9900,
                footer: `Total warnings: ${warnings.length}`,
                thumbnail: target.user.displayAvatarURL()
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] warnings.js:`, error.message);
            await interaction.reply({
                embeds: [errorEmbed('Error retrieving warnings.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
