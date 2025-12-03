const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const { mail } = require('../../utils/database');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inbox')
        .setDescription('View your inbox'),
    
    async execute(interaction, client) {
        try {
            if (!interaction.guild || !interaction.user) {
                return interaction.reply({ content: `${emoji.error || '❌'} This command can only be used in a server.`, flags: 64 }).catch(() => {});
            }

            const inbox = mail?.getInbox?.(interaction.guild.id, interaction.user.id) || [];
            
            if (!inbox || inbox.length === 0) {
                const emptyEmbed = createEmbed({
                    title: 'Your Inbox',
                    description: 'Your inbox is empty.',
                    color: 0x808080
                }) || new (require('discord.js').EmbedBuilder)().setTitle('Inbox').setDescription('Empty');
                
                return interaction.reply({ embeds: [emptyEmbed], flags: 64 }).catch(() => {
                    interaction.reply({ content: `${emoji.mail || '📬'} Your inbox is empty.`, flags: 64 });
                });
            }
            
            const mailList = await Promise.all(
                inbox.slice(-10).reverse().map(async (m, index) => {
                    try {
                        let senderName = 'Unknown';
                        if (m?.from && client?.users) {
                            try {
                                const sender = await client.users.fetch(m.from).catch(() => null);
                                if (sender?.username) senderName = sender.username;
                            } catch (e) {}
                        }
                        
                        const date = m?.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'Unknown date';
                        const readStatus = m?.read ? '' : `${emoji.mail || '📬'} `;
                        const subject = m?.subject || 'No subject';
                        
                        return `**${index + 1}.** ${readStatus}${subject}\n   From: ${senderName} | ${date}`;
                    } catch (e) {
                        return `**${index + 1}.** Message (error reading)`;
                    }
                })
            );
            
            const unreadCount = inbox.filter(m => !m?.read).length || 0;
            
            const inboxEmbed = createEmbed({
                title: 'Your Inbox',
                description: mailList.join('\n\n') || 'No messages to display',
                color: 0x0099ff,
                footer: `${inbox.length || 0} message(s) | ${unreadCount} unread | Use /read <number> to read`
            }) || new (require('discord.js').EmbedBuilder)()
                .setTitle('Your Inbox')
                .setDescription(`${inbox.length} messages`)
                .setColor(0x0099ff);
            
            await interaction.reply({ embeds: [inboxEmbed], flags: 64 }).catch(() => {
                interaction.reply({ content: `${emoji.mail || '📬'} You have ${inbox.length} messages in your inbox`, flags: 64 });
            });
        } catch (error) {
            console.error('[inbox.js]', error.message);
            const errorEmbed = AdvancedEmbed.commandError?.('Inbox Error', error.message || 'Error loading inbox') || new (require('discord.js').EmbedBuilder)().setTitle('Error').setDescription('Failed to load inbox');
            
            if (!interaction.replied) {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 }).catch(() => {
                    interaction.reply({ content: '❌ Error loading inbox.', flags: 64 });
                });
            }
        }
    }
};
