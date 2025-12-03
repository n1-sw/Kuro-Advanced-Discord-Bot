const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, formatNumber } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin and bet on the outcome')
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Your choice')
                .setRequired(true)
                .addChoices(
                    { name: 'Heads', value: 'heads' },
                    { name: 'Tails', value: 'tails' }
                ))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to bet')
                .setRequired(true)
                .setMinValue(config.games.coinflip.minBet)
                .setMaxValue(config.games.coinflip.maxBet)),
    
    async execute(interaction) {
        try {
            const userChoice = interaction.options.getString('choice');
            const amount = interaction.options.getInteger('amount');
            
            const userData = await users.get(interaction.guild.id, interaction.user.id);
            
            if ((userData.coins || 0) < amount) {
                return interaction.reply({ embeds: [errorEmbed(`You don't have enough coins. Balance: ${formatNumber(userData.coins || 0)}`)], flags: 64 });
            }
            
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            const won = userChoice === result;
            
            let newCoins;
            if (won) {
                newCoins = (userData.coins || 0) + amount;
                await users.update(interaction.guild.id, interaction.user.id, { coins: newCoins });
                await interaction.reply({ embeds: [successEmbed(
                    `🪙 The coin landed on **${result}**!\n` +
                    `You won **${formatNumber(amount)} coins**!\n` +
                    `New balance: **${formatNumber(newCoins)} coins**`
                )] });
            } else {
                newCoins = (userData.coins || 0) - amount;
                await users.update(interaction.guild.id, interaction.user.id, { coins: newCoins });
                await interaction.reply({ embeds: [errorEmbed(
                    `🪙 The coin landed on **${result}**...\n` +
                    `You lost **${formatNumber(amount)} coins**.\n` +
                    `New balance: **${formatNumber(newCoins)} coins**`
                )] });
            }
        } catch (error) {
            console.error(`[Command Error] coinflip.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error playing coinflip.', flags: 64 }).catch(() => {});
            }
        }
    }
};
