const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency and response time'),
    
    async execute(interaction) {
        try {
            const sent = await interaction.reply({ content: 'Calculating ping...', flags: 64, fetchReply: true });
            const ping = sent.createdTimestamp - interaction.createdTimestamp;
            const apiPing = interaction.client.ws.ping;
            
            const embed = createEmbed({
                title: `${emoji.trophy} Ping Test`,
                description: 'Bot latency measurements:',
                color: 0x00FF00,
                fields: [
                    { name: 'Message Latency', value: `${ping}ms`, inline: true },
                    { name: 'API Latency', value: `${apiPing}ms`, inline: true },
                    { name: 'Status', value: ping < 100 ? `${emoji.success} Excellent` : ping < 200 ? `${emoji.warning} Good` : `${emoji.error} High`, inline: true }
                ],
                footer: 'Lower latency = Better response time'
            });
            
            await interaction.editReply({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('Ping command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error checking ping.', flags: 64 }).catch(() => {});
            }
        }
    }
};
