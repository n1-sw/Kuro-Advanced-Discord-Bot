const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, errorEmbed } = require('../../utils/helpers');
const { users } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View your inventory'),
    
    async execute(interaction) {
        try {
            const userData = users.get(interaction.guild.id, interaction.user.id);
            
            if (userData.inventory.length === 0) {
                return interaction.reply({ embeds: [createEmbed({
                    title: `${interaction.user.username}'s Inventory`,
                    description: 'Your inventory is empty. Buy items from the `/shop`!',
                    color: 0x808080
                })] });
            }
            
            const itemList = userData.inventory.map((item, index) => {
                const date = new Date(item.purchasedAt).toLocaleDateString();
                return `**${index + 1}.** ${item.name}\n   *Purchased: ${date}*`;
            }).join('\n\n');
            
            const embed = createEmbed({
                title: `${interaction.user.username}'s Inventory`,
                description: itemList,
                color: 0x7289da,
                footer: `${userData.inventory.length} item(s) | Use /sell <number> to sell`
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in inventory command:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error retrieving inventory.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
