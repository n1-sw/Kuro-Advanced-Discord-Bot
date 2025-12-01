const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, formatNumber } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the server leaderboard')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Leaderboard type')
                .setRequired(false)
                .addChoices(
                    { name: 'Levels', value: 'level' },
                    { name: 'Coins', value: 'coins' }
                )),
    
    async execute(interaction) {
        const type = interaction.options.getString('type') || 'level';
        const isLevelBoard = type === 'level';
        
        const leaderboard = users.getLeaderboard(interaction.guild.id, type, 10);
        
        if (leaderboard.length === 0) {
            return interaction.reply({ content: 'No users found on the leaderboard yet.', flags: 64 });
        }
        
        const leaderboardEntries = await Promise.all(leaderboard.map(async (user, index) => {
            let username = 'Unknown User';
            try {
                const member = await interaction.guild.members.fetch(user.userId);
                username = member.user.username;
            } catch (e) {}
            
            const medal = index === 0 ? emoji.gold_medal : index === 1 ? emoji.silver_medal : index === 2 ? emoji.bronze_medal : `${index + 1}.`;
            
            if (isLevelBoard) {
                return `${medal} **${username}**\nLevel ${user.level} | ${formatNumber(user.xp)} XP`;
            } else {
                return `${medal} **${username}**\n${formatNumber(user.coins)} coins`;
            }
        }));
        
        const embed = createEmbed({
            title: `${interaction.guild.name} ${isLevelBoard ? 'Level' : 'Coins'} Leaderboard`,
            description: leaderboardEntries.join('\n\n'),
            color: 0xffd700,
            thumbnail: interaction.guild.iconURL(),
            footer: `Top ${leaderboard.length} users`
        });
        
        await interaction.reply({ embeds: [embed] });
    }
};
