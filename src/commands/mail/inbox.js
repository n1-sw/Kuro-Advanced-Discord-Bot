const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const { mail } = require('../../utils/database');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inbox')
        .setDescription('View your inbox'),
    
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
                return interaction.reply({ embeds: [createEmbed({
                    title: 'Your Inbox',
                    description: 'Your inbox is empty.',
                    color: 0x808080
                })], flags: 64 });
            }
            
            const mailList = await Promise.all(inbox.slice(-10).reverse().map(async (m, index) => {
                let senderName = 'Unknown';
                try {
                    if (m.from) {
                        const sender = await client.users.fetch(m.from).catch(() => null);
                        if (sender) senderName = sender.username;
                    }
                } catch (e) {}
                
                const date = new Date(m.timestamp).toLocaleDateString();
                const readStatus = m.read ? '' : `${emoji.mail} `;
                
                return `**${index + 1}.** ${readStatus}${m.subject}\n   From: ${senderName} | ${date}`;
            }));
            
            const unreadCount = inbox.filter(m => !m.read).length;
            
            const embed = createEmbed({
                title: 'Your Inbox',
                description: mailList.join('\n\n'),
                color: 0x0099ff,
                footer: `${inbox.length} message(s) | ${unreadCount} unread | Use /read <number> to read`
            });
            
            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            console.error('Inbox command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error loading inbox.', flags: 64 }).catch(() => {});
            }
        }
    }
};
