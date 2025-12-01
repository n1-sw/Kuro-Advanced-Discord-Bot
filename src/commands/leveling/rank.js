const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, calculateXpForLevel, formatNumber, progressBar } = require('../../utils/helpers');
const { users } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check your rank and level')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check (leave empty for yourself)')
                .setRequired(false)),
    
    async execute(interaction) {
        try {
            const target = interaction.options.getMember('user') || interaction.member;
            const userData = users.get(interaction.guild.id, target.id);
            
            let currentLevelXp = 0;
            for (let i = 0; i < userData.level; i++) {
                currentLevelXp += calculateXpForLevel(i);
            }
            
            const xpInCurrentLevel = userData.xp - currentLevelXp;
            const xpNeededForNext = calculateXpForLevel(userData.level);
            
            const guildUsers = Object.entries(users.data)
                .filter(([key]) => key.startsWith(interaction.guild.id))
                .map(([key, data]) => data)
                .sort((a, b) => b.level - a.level || b.xp - a.xp);
            
            const rank = guildUsers.findIndex(u => u.userId === target.id) + 1;
            
            const embed = createEmbed({
                title: `${target.user.username}'s Rank`,
                color: 0x7289da,
                thumbnail: target.user.displayAvatarURL(),
                fields: [
                    { name: 'Rank', value: `#${rank || '?'}`, inline: true },
                    { name: 'Level', value: `${userData.level}`, inline: true },
                    { name: 'Total XP', value: formatNumber(userData.xp), inline: true },
                    { name: 'Progress to Next Level', value: `${progressBar(xpInCurrentLevel, xpNeededForNext, 15)}\n${formatNumber(Math.max(0, xpInCurrentLevel))} / ${formatNumber(xpNeededForNext)} XP`, inline: false },
                    { name: 'Messages', value: formatNumber(userData.totalMessages), inline: true },
                    { name: 'Coins', value: formatNumber(userData.coins), inline: true }
                ]
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in rank command:', error);
            await interaction.reply({
                embeds: [createEmbed({ title: 'Error', description: 'Error fetching rank information.', color: 0xff0000 })],
                flags: 64
            }).catch(() => {});
        }
    }
};
