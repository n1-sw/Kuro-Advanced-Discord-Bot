const { SlashCommandBuilder } = require('discord.js');
const { calculateXpForLevel, formatNumber, progressBar } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

const getRankTitle = (level) => {
    if (level >= 100) return 'Legendary';
    if (level >= 75) return 'Master';
    if (level >= 50) return 'Expert';
    if (level >= 30) return 'Veteran';
    if (level >= 20) return 'Advanced';
    if (level >= 10) return 'Intermediate';
    if (level >= 5) return 'Beginner';
    return 'Newcomer';
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('View your rank card with detailed stats')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check')
                .setRequired(false)),
    
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const target = interaction.options.getMember('user') || interaction.member;
            const userData = users.get(interaction.guild.id, target.id) || { level: 0, xp: 0, dailyStreak: 0, totalMessages: 0, coins: 0 };
            
            if (!userData.dailyStreak) userData.dailyStreak = 0;
            if (!userData.totalMessages) userData.totalMessages = 0;

            let currentLevelXp = 0;
            for (let i = 0; i < (userData.level || 0); i++) {
                currentLevelXp += calculateXpForLevel(i);
            }
            
            const xpInCurrentLevel = (userData.xp || 0) - currentLevelXp;
            const xpNeededForNext = calculateXpForLevel(userData.level || 0);
            const progressPercent = xpNeededForNext > 0 ? Math.floor((xpInCurrentLevel / xpNeededForNext) * 100) : 0;
            
            const guildUsers = Object.entries(users.data || {})
                .filter(([key]) => key.startsWith(interaction.guild.id))
                .map(([, data]) => data)
                .sort((a, b) => (b.level || 0) - (a.level || 0) || (b.xp || 0) - (a.xp || 0)) || [];
            
            const rank = guildUsers.findIndex(u => u.userId === target.id) + 1;
            const rankTitle = getRankTitle(userData.level || 0);

            const embed = AdvancedEmbed.leveling?.(
                `${rankTitle} • Level ${userData.level || 0}`,
                `${target.user?.username || 'User'}'s Rank Card\n\n${progressBar?.(xpInCurrentLevel, xpNeededForNext, 20) || `${Math.round(progressPercent)}% XP`}`,
                [
                    { name: `${emoji.leveling} Level`, value: `\`${userData.level || 0}\``, inline: true },
                    { name: `${emoji.chart} Rank`, value: `\`#${rank}/${guildUsers.length || 1}\``, inline: true },
                    { name: `${emoji.fire} Streak`, value: `\`${userData.dailyStreak || 0}\` days`, inline: true },
                    { name: `${emoji.messages} Messages`, value: `\`${userData.totalMessages || 0}\``, inline: true },
                    { name: `${emoji.diamond} Coins`, value: `\`${formatNumber(userData.coins || 0)}\``, inline: true },
                    { name: `${emoji.star} XP`, value: `\`${xpInCurrentLevel}/${xpNeededForNext}\``, inline: true }
                ],
                target.user?.displayAvatarURL?.({ size: 256 })
            ) || new (require('discord.js').EmbedBuilder)().setTitle(`${rankTitle} • Level ${userData.level || 0}`).setDescription(`Rank #${rank}`);

            await interaction.editReply({ embeds: [embed] }).catch(() => {
                interaction.editReply({ content: `📊 **${rankTitle}** • Level ${userData.level || 0} | Rank #${rank}` });
            });
        } catch (error) {
            console.error(`[rank.js]`, error.message);
            const embed = AdvancedEmbed.commandError?.('Rank Failed', error.message || 'Could not load rank card') || new (require('discord.js').EmbedBuilder)().setTitle('Error').setDescription('Failed to load rank');
            if (!interaction.replied && interaction.deferred) {
                await interaction.editReply({ embeds: [embed] }).catch(() => {
                    interaction.editReply({ content: '❌ Error loading rank card' });
                });
            }
        }
    }
};
