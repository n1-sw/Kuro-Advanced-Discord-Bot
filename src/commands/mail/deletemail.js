const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { mail } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletemail')
        .setDescription('Delete a mail message')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Mail number from inbox')
                .setRequired(true)
                .setMinValue(1)),
    
    async execute(interaction) {
        try {
            if (!interaction.user || !interaction.guild) {
                return interaction.reply({ content: 'Invalid interaction context.', flags: 64 });
            }

            const inbox = mail.getInbox(interaction.guild.id, interaction.user.id);
            
            if (inbox.length === 0) {
                return interaction.reply({ embeds: [errorEmbed('Your inbox is empty.')], flags: 64 });
            }
            
            const mailIndex = interaction.options.getInteger('number') - 1;
            const reversedInbox = [...inbox].reverse();
            
            if (mailIndex < 0 || mailIndex >= reversedInbox.length) {
                return interaction.reply({ embeds: [errorEmbed('Invalid mail number. Use `/inbox` to see your messages.')], flags: 64 });
            }
            
            const mailItem = reversedInbox[mailIndex];
            if (!mailItem) {
                return interaction.reply({ embeds: [errorEmbed('Mail not found.')], flags: 64 });
            }

            mail.delete(interaction.guild.id, interaction.user.id, mailItem.id);
            
            await interaction.reply({ 
                embeds: [successEmbed(`Mail "${mailItem.subject}" has been deleted.`)],
                flags: 64
            });
        } catch (error) {
            console.error('Delete mail command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error deleting mail.', flags: 64 }).catch(() => {});
            }
        }
    }
};
