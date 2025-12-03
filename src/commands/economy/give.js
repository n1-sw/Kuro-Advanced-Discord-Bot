const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, formatNumber } = require('../../utils/helpers');
const { users } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Give coins to another user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to give coins to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of coins to give')
                .setRequired(true)
                .setMinValue(1)),
    
    async execute(interaction) {
        try {
            const target = interaction.options.getMember('user');
            const amount = interaction.options.getInteger('amount');
            
            if (!target) {
                return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], flags: 64 });
            }
            
            if (target.id === interaction.user.id) {
                return interaction.reply({ embeds: [errorEmbed('You cannot give coins to yourself.')], flags: 64 });
            }
            
            if (target.user.bot) {
                return interaction.reply({ embeds: [errorEmbed('You cannot give coins to bots.')], flags: 64 });
            }
            
            const senderData = await users.get(interaction.guild.id, interaction.user.id);
            
            if ((senderData.coins || 0) < amount) {
                return interaction.reply({ embeds: [errorEmbed(`You don't have enough coins. Balance: ${formatNumber(senderData.coins || 0)}`)], flags: 64 });
            }
            
            const receiverData = await users.get(interaction.guild.id, target.id);
            
            const newSenderCoins = (senderData.coins || 0) - amount;
            const newReceiverCoins = (receiverData.coins || 0) + amount;
            
            await users.update(interaction.guild.id, interaction.user.id, { coins: newSenderCoins });
            await users.update(interaction.guild.id, target.id, { coins: newReceiverCoins });
            
            await interaction.reply({ 
                embeds: [successEmbed(
                    `You gave **${formatNumber(amount)} coins** to ${target.user.username}!\n` +
                    `Your new balance: **${formatNumber(newSenderCoins)} coins**`
                )] 
            });
        } catch (error) {
            console.error(`[give.js]`, error.message);
            await interaction.reply({
                embeds: [errorEmbed('Error giving coins.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
