const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, formatNumber, formatDuration } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily coin reward'),
    
    async execute(interaction) {
        try {
            const userData = users.get(interaction.guild.id, interaction.user.id);
            const now = Date.now();
            const cooldown = 24 * 60 * 60 * 1000;
            
            if (now - userData.lastDaily < cooldown) {
                const remaining = cooldown - (now - userData.lastDaily);
                return interaction.reply({ 
                    embeds: [errorEmbed(`You can claim your daily reward in ${formatDuration(remaining)}.`)],
                    flags: 64
                });
            }
            
            const bonus = Math.floor(userData.level * 10);
            const reward = config.economy.dailyReward + bonus;
            
            userData.coins += reward;
            userData.lastDaily = now;
            users.save();
            
            await interaction.reply({ 
                embeds: [successEmbed(
                    `You claimed your daily reward of **${formatNumber(reward)} coins**!\n` +
                    (bonus > 0 ? `(Base: ${config.economy.dailyReward} + Level Bonus: ${bonus})` : '') +
                    `\nNew balance: **${formatNumber(userData.coins)} coins**`
                )] 
            });
        } catch (error) {
            console.error('Error in daily command:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error claiming daily reward.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
