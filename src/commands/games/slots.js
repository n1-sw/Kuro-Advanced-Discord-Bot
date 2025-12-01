const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, errorEmbed, formatNumber, randomInt } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const config = require('../../config');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Play the slot machine')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to bet')
                .setRequired(true)
                .setMinValue(config.games.slots.minBet)
                .setMaxValue(config.games.slots.maxBet)),
    
    async execute(interaction) {
        try {
            const amount = interaction.options.getInteger('amount');
            const { jackpotMultiplier } = config.games.slots;
            
            const userData = users.get(interaction.guild.id, interaction.user.id);
            
            if (userData.coins < amount) {
                return interaction.reply({ embeds: [errorEmbed(`You don't have enough coins. Balance: ${formatNumber(userData.coins)}`)], flags: 64 });
            }
            
            const symbols = ['7️⃣', '🍒', '🍋', '🍊', '🍇'];
            const weights = [5, 15, 25, 30, 25];
            
            const getSymbol = () => {
                const total = weights.reduce((a, b) => a + b, 0);
                let random = randomInt(1, total);
                
                for (let i = 0; i < symbols.length; i++) {
                    random -= weights[i];
                    if (random <= 0) return symbols[i];
                }
                return symbols[symbols.length - 1];
            };
            
            const reels = [getSymbol(), getSymbol(), getSymbol()];
            const slotDisplay = `[ ${reels[0]} | ${reels[1]} | ${reels[2]} ]`;
            
            let winnings = 0;
            let resultMessage = '';
            
            if (reels[0] === reels[1] && reels[1] === reels[2]) {
                if (reels[0] === '7️⃣') {
                    winnings = amount * jackpotMultiplier;
                    resultMessage = `${emoji.gamble} JACKPOT! You won **${formatNumber(winnings)} coins**!`;
                } else {
                    winnings = amount * 5;
                    resultMessage = `${emoji.gamble} Three of a kind! You won **${formatNumber(winnings)} coins**!`;
                }
            } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
                winnings = amount * 2;
                resultMessage = `${emoji.gamble} Two of a kind! You won **${formatNumber(winnings)} coins**!`;
            } else {
                winnings = -amount;
                resultMessage = `${emoji.gamble} No match. You lost **${formatNumber(amount)} coins**.`;
            }
            
            userData.coins += winnings;
            users.save();
            
            const color = winnings > 0 ? 0x00ff00 : 0xff0000;
            
            const embed = createEmbed({
                title: `${emoji.gamble} Slot Machine`,
                description: `${slotDisplay}\n\n${resultMessage}\n\nNew balance: **${formatNumber(userData.coins)} coins**`,
                color
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in slots command:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error playing slots.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
