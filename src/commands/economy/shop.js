const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, errorEmbed, formatNumber } = require('../../utils/helpers');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View the shop'),
    
    async execute(interaction) {
        try {
            const items = config.shop.items;
            
            const itemList = items.map((item, index) => {
                return `**${index + 1}. ${item.name}** - ${formatNumber(item.price)} coins\n   ${item.description}`;
            }).join('\n\n');
            
            const embed = createEmbed({
                title: 'Server Shop',
                description: itemList,
                color: 0x00ff00,
                footer: 'Use /buy <item number> to purchase an item'
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] shop.js:`, error.message);
            await interaction.reply({
                embeds: [errorEmbed('Error retrieving shop.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
