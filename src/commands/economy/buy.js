const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, formatNumber } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy an item from the shop')
        .addIntegerOption(option =>
            option.setName('item')
                .setDescription('Item number from the shop')
                .setRequired(true)
                .setMinValue(1)),
    
    async execute(interaction) {
        try {
            const itemIndex = interaction.options.getInteger('item') - 1;
            const items = config.shop.items;
            
            if (itemIndex < 0 || itemIndex >= items.length) {
                return interaction.reply({ embeds: [errorEmbed('Invalid item number. Use `/shop` to see available items.')], flags: 64 });
            }
            
            const item = items[itemIndex];
            const data = users.get(interaction.guild.id, interaction.user.id);
            
            if (userData.coins < item.price) {
                return interaction.reply({ embeds: [errorEmbed(`You don't have enough coins. You need ${formatNumber(item.price)} coins.`)], flags: 64 });
            }
            
            userData.coins -= item.price;
            userData.inventory.push({
                id: item.id,
                name: item.name,
                purchasedAt: Date.now()
            });
            users.save();
            
            await interaction.reply({ 
                embeds: [successEmbed(
                    `You purchased **${item.name}** for **${formatNumber(item.price)} coins**!\n` +
                    `New balance: **${formatNumber(userData.coins)} coins**\n\n` +
                    `Check your inventory with \`/inventory\``
                )] 
            });
        } catch (error) {
            console.error(`[Command Error] buy.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error purchasing item.', flags: 64 }).catch(() => {});
            }
        }
    }
};
