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
            
            let sorted, title;
            if (type === 'coins') {
                sorted = await users.getLeaderboard(interaction.guild.id, 'coins', 10);
                title = 'Richest Members';
            } else if (type === 'messages') {
                sorted = await users.getLeaderboard(interaction.guild.id, 'messages', 10);
                title = 'Most Active';
            } else {
                sorted = await users.getLeaderboard(interaction.guild.id, 'level', 10);
                title = 'Top Levels';
            }

            const medals = ['🥇', '🥈', '🥉'];
            const entries = sorted.map((user, idx) => {
                const position = idx < 3 ? medals[idx] : `\`${idx + 1}.\``;
                let value = '';
                if (type === 'coins') value = `${formatNumber(user.coins || 0)} coins`;
                else if (type === 'messages') value = `${formatNumber(user.totalMessages || 0)} messages`;
                else value = `Level ${user.level || 0} (${formatNumber(user.xp || 0)} XP)`;
                return `${position} <@${user.odId}> - ${value}`;
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
