const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Check bot real uptime'),
    
    async execute(interaction) {
        try {
            const uptime = interaction.client.uptime;
            
            const seconds = Math.floor((uptime / 1000) % 60);
            const minutes = Math.floor((uptime / (1000 * 60)) % 60);
            const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
            const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
            
            const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            const startTime = new Date(Date.now() - uptime);
            
            const embed = createEmbed({
                title: `${emoji.clock} Bot Uptime`,
                description: 'Bot availability and runtime information:',
                color: 0x7289da,
                fields: [
                    { name: 'Uptime', value: uptimeString, inline: true },
                    { name: 'Started At', value: `<t:${Math.floor(startTime.getTime() / 1000)}:R>`, inline: true },
                    { name: 'Total Milliseconds', value: `${uptime}ms`, inline: true },
                    { name: 'Days', value: `${days}`, inline: true },
                    { name: 'Hours', value: `${hours}`, inline: true },
                    { name: 'Minutes', value: `${minutes}`, inline: true }
                ],
                footer: 'Bot is running 24/7 on Wispbyte hosting'
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] uptime.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error checking uptime.', flags: 64 }).catch(() => {});
            }
        }
    }
};
