const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, formatNumber, randomInt } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gamble')
        .setDescription('High risk gambling - double or nothing')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to bet (50-5000)')
                .setRequired(true)
                .setMinValue(50)
                .setMaxValue(5000)),
    
    async execute(interaction) {
        try {
            const amount = interaction.options.getInteger('amount');
            
            const userData = await users.get(interaction.guild.id, interaction.user.id);
            
            if ((userData.coins || 0) < amount) {
                return interaction.reply({ embeds: [errorEmbed(`You don't have enough coins. Balance: ${formatNumber(userData.coins || 0)}`)], flags: 64 });
            }
            
            const roll = randomInt(1, 100);
            
            if (roll <= 45) {
                const winnings = amount * 2;
                const newCoins = (userData.coins || 0) + amount;
                await users.update(interaction.guild.id, interaction.user.id, { coins: newCoins });
                await interaction.reply({ embeds: [successEmbed(
                    `${emoji.gamble} You rolled **${roll}** (needed 45 or below)\n` +
                    `You won **${formatNumber(winnings)} coins**!\n` +
                    `New balance: **${formatNumber(newCoins)} coins**`
                )] });
            } else {
                const newCoins = (userData.coins || 0) - amount;
                await users.update(interaction.guild.id, interaction.user.id, { coins: newCoins });
                await interaction.reply({ embeds: [errorEmbed(
                    `${emoji.gamble} You rolled **${roll}** (needed 45 or below)\n` +
                    `You lost **${formatNumber(amount)} coins**.\n` +
                    `New balance: **${formatNumber(newCoins)} coins**`
                )] });
            }
        } catch (error) {
            console.error(`[Command Error] gamble.js:`, error.message);
            await interaction.reply({
                embeds: [errorEmbed('Error processing gamble.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
