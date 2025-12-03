const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete multiple messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-9000)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(9000))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        
        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);
            
            await interaction.reply({ 
                embeds: [successEmbed(`Deleted ${deleted.size} messages.`)],
                flags: 64
            });
        } catch (error) {
            console.error(`[Command Error] purge.js:`, error.message);
            await interaction.reply({ 
                embeds: [errorEmbed('Failed to delete messages. Messages older than 14 days cannot be bulk deleted.')],
                flags: 64 
            });
        }
    }
};
