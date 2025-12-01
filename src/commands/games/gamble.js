const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, formatNumber, randomInt } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const emoji = require('../../utils/emoji');

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
            
            const userData = users.get(interaction.guild.id, interaction.user.id);
            
            if (userData.coins < amount) {
                return interaction.reply({ embeds: [errorEmbed(`You don't have enough coins. Balance: ${formatNumber(userData.coins)}`)], flags: 64 });
            }
            
            const roll = randomInt(1, 100);
            
            if (roll <= 45) {
                const winnings = amount * 2;
                userData.coins += amount;
                await interaction.reply({ embeds: [successEmbed(
                    `${emoji.gamble} You rolled **${roll}** (needed 45 or below)\n` +
                    `You won **${formatNumber(winnings)} coins**!\n` +
                    `New balance: **${formatNumber(userData.coins)} coins**`
                )] });
            } else {
                userData.coins -= amount;
                await interaction.reply({ embeds: [errorEmbed(
                    `${emoji.gamble} You rolled **${roll}** (needed 45 or below)\n` +
                    `You lost **${formatNumber(amount)} coins**.\n` +
                    `New balance: **${formatNumber(userData.coins)} coins**`
                )] });
            }
            
            users.save();
        } catch (error) {
            console.error('Error in gamble command:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error processing gamble.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
