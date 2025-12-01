const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, formatNumber } = require('../../utils/helpers');
const { users } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your coin balance')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check (leave empty for yourself)')
                .setRequired(false)),
    
    async execute(interaction) {
        try {
            const target = interaction.options.getMember('user') || interaction.member;
            const userData = users.get(interaction.guild.id, target.id);
            
            const embed = createEmbed({
                title: `${target.user.username}'s Wallet`,
                color: 0xffd700,
                thumbnail: target.user.displayAvatarURL(),
                fields: [
                    { name: 'Coins', value: formatNumber(userData.coins), inline: true },
                    { name: 'Level', value: `${userData.level}`, inline: true }
                ],
                footer: 'Earn coins by leveling up and playing games!'
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Balance command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error checking balance.', flags: 64 }).catch(() => {});
            }
        }
    }
};
