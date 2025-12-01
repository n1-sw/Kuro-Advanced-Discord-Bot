const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, errorEmbed } = require('../../utils/helpers');
const { mail } = require('../../utils/database');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('read')
        .setDescription('Read a mail message')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Mail number from inbox')
                .setRequired(true)
                .setMinValue(1)),
    
    async execute(interaction, client) {
        try {
            if (!interaction.guild) {
                return interaction.reply({ content: `${emoji.error} This command can only be used in a server.`, flags: 64 }).catch(() => {});
            }

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
            
            let senderName = 'Unknown';
            try {
                if (mailItem.from) {
                    const sender = await client.users.fetch(mailItem.from).catch(() => null);
                    if (sender) senderName = sender.username;
                }
            } catch (e) {}
            
            const date = new Date(mailItem.timestamp).toLocaleString();
            
            mail.markRead(interaction.guild.id, interaction.user.id, mailItem.id);
            
            const embed = createEmbed({
                title: mailItem.subject,
                description: mailItem.content,
                color: 0x0099ff,
                fields: [
                    { name: 'From', value: senderName, inline: true },
                    { name: 'Date', value: date, inline: true }
                ],
                footer: `Use /deletemail ${mailIndex + 1} to delete this message`
            });
            
            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            console.error('Read command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error reading mail.', flags: 64 }).catch(() => {});
            }
        }
    }
};
