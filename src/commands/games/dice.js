const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, formatNumber, randomInt } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll dice against the bot')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to bet')
                .setRequired(true)
                .setMinValue(config.games.dice.minBet)
                .setMaxValue(config.games.dice.maxBet)),
    
    async execute(interaction) {
        try {
            const amount = interaction.options.getInteger('amount');
            
            const data = users.get(interaction.guild.id, interaction.user.id);
            
            if (userData.coins < amount) {
                return interaction.reply({ embeds: [errorEmbed(`You don't have enough coins. Balance: ${formatNumber(userData.coins)}`)], flags: 64 });
            }
            
            const playerRoll = randomInt(1, 6);
            const botRoll = randomInt(1, 6);
            
            let resultText = `${emoji.dice} You rolled: **${playerRoll}**\n${emoji.bot} Bot rolled: **${botRoll}**\n\n`;
            
            if (playerRoll > botRoll) {
                userData.coins += amount;
                resultText += `You won **${formatNumber(amount)} coins**!\nNew balance: **${formatNumber(userData.coins)} coins**`;
                await interaction.reply({ embeds: [successEmbed(resultText)] });
            } else if (playerRoll < botRoll) {
                userData.coins -= amount;
                resultText += `You lost **${formatNumber(amount)} coins**.\nNew balance: **${formatNumber(userData.coins)} coins**`;
                await interaction.reply({ embeds: [errorEmbed(resultText)] });
            } else {
                resultText += `It's a tie! No coins lost or gained.\nBalance: **${formatNumber(userData.coins)} coins**`;
                await interaction.reply({ embeds: [successEmbed(resultText)] });
            }
            
            users.save();
        } catch (error) {
            console.error(`[Command Error] dice.js:`, error.message);
            await interaction.reply({
                embeds: [errorEmbed('Error playing dice game.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
