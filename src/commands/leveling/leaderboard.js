const { SlashCommandBuilder } = require('discord.js');
const { formatNumber } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

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
                    { name: 'Coins', value: 'coins' },
                    { name: 'Messages', value: 'messages' }
                )),
    
    async execute(interaction) {
        try {
            const type = interaction.options.getString('type') || 'level';
            
            const guildUsers = Object.entries(users.data)
                .filter(([key]) => key.startsWith(interaction.guild.id))
                .map(([, data]) => data);

            let sorted, title;
            if (type === 'coins') {
                sorted = [...guildUsers].sort((a, b) => b.coins - a.coins).slice(0, 10);
                title = 'Richest Members';
            } else if (type === 'messages') {
                sorted = [...guildUsers].sort((a, b) => (b.totalMessages || 0) - (a.totalMessages || 0)).slice(0, 10);
                title = 'Most Active';
            } else {
                sorted = [...guildUsers].sort((a, b) => b.level - a.level || b.xp - a.xp).slice(0, 10);
                title = 'Top Levels';
            }

            const medals = ['🥇', '🥈', '🥉'];
            const entries = sorted.map((user, idx) => {
                const position = idx < 3 ? medals[idx] : `\`${idx + 1}.\``;
                let value = '';
                if (type === 'coins') value = `${formatNumber(user.coins)} coins`;
                else if (type === 'messages') value = `${formatNumber(user.totalMessages || 0)} messages`;
                else value = `Level ${user.level} (${formatNumber(user.xp)} XP)`;
                return `${position} <@${user.userId}> - ${value}`;
            });

            const embed = AdvancedEmbed.leaderboard(`🏆 ${title}`, entries, emoji.color_success);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] leaderboard.js:`, error.message);
            const embed = AdvancedEmbed.commandError('Leaderboard Failed', 'Could not load leaderboard');
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {});
            }
        }
    }
};
