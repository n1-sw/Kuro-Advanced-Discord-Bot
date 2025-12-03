const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, formatNumber } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sell')
        .setDescription('Sell an item from your inventory')
        .addIntegerOption(option =>
            option.setName('item')
                .setDescription('Item number from your inventory')
                .setRequired(true)
                .setMinValue(1)),
    
    async execute(interaction) {
        try {
            const itemIndex = interaction.options.getInteger('item') - 1;
            const userData = await users.get(interaction.guild.id, interaction.user.id);
            
            if (!userData.inventory || userData.inventory.length === 0) {
                return interaction.reply({ embeds: [errorEmbed('Your inventory is empty.')], flags: 64 });
            }
            
            if (itemIndex < 0 || itemIndex >= userData.inventory.length) {
                return interaction.reply({ embeds: [errorEmbed('Invalid item number. Use `/inventory` to see your items.')], flags: 64 });
            }
            
            const inventoryItem = userData.inventory[itemIndex];
            const shopItem = config.shop.items.find(i => i.id === inventoryItem.id);
            
            const sellPrice = shopItem ? Math.floor(shopItem.price * 0.5) : 10;
            
            const newInventory = [...userData.inventory];
            newInventory.splice(itemIndex, 1);
            const newCoins = (userData.coins || 0) + sellPrice;
            
            await users.update(interaction.guild.id, interaction.user.id, {
                coins: newCoins,
                inventory: newInventory
            });
            
            await interaction.reply({ 
                embeds: [successEmbed(
                    `You sold **${inventoryItem.name}** for **${formatNumber(sellPrice)} coins**!\n` +
                    `New balance: **${formatNumber(newCoins)} coins**`
                )] 
            });
        } catch (error) {
            console.error(`[Command Error] sell.js:`, error.message);
            await interaction.reply({
                embeds: [errorEmbed('Error selling item.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
