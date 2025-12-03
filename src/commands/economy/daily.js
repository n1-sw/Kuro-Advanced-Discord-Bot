const { SlashCommandBuilder } = require('discord.js');
const { formatNumber, formatDuration } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const config = require('../../config');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily coin reward'),
    
    async execute(interaction) {
        try {
            const userData = users.get(interaction.guild.id, interaction.user.id);
            const now = Date.now();
            const cooldown = 24 * 60 * 60 * 1000;
            
            if (!userData.dailyStreak) userData.dailyStreak = 0;
            
            if (now - userData.lastDaily < cooldown) {
                const remaining = cooldown - (now - userData.lastDaily);
                const embed = AdvancedEmbed.warning('Daily Reward', `You've already claimed your daily reward!\n\nNext claim in: \`${formatDuration(remaining)}\``);
                return interaction.reply({ embeds: [embed], flags: 64 });
            }
            
            userData.dailyStreak++;
            const baseReward = config.economy.dailyReward;
            const levelBonus = Math.floor(userData.level * 10);
            const streakBonus = Math.floor(userData.dailyStreak * 5);
            const totalReward = baseReward + levelBonus + streakBonus;
            
            userData.coins += totalReward;
            userData.lastDaily = now;
            users.save();
            
            const embed = AdvancedEmbed.economy(`Daily Reward Claimed`, `💝 You earned \`${formatNumber(totalReward)}\` coins!`, [
                { name: `${emoji.coin} Base Reward`, value: `\`${formatNumber(baseReward)}\``, inline: true },
                { name: `${emoji.leveling} Level Bonus`, value: `\`+${formatNumber(levelBonus)}\``, inline: true },
                { name: `${emoji.fire} Streak Bonus`, value: `\`+${formatNumber(streakBonus)}\``, inline: true },
                { name: `💰 New Balance`, value: `\`${formatNumber(userData.coins)}\` coins`, inline: false },
                { name: `🔥 Streak`, value: `\`${userData.dailyStreak}\` days`, inline: true }
            ]);
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] daily.js:`, error.message);
            const embed = AdvancedEmbed.commandError('Daily Reward Failed', 'Could not claim your daily reward');
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {});
            }
        }
    }
};
