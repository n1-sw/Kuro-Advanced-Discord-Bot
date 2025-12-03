const { SlashCommandBuilder, version } = require('discord.js');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('View information about the bot'),
    
    async execute(interaction) {
        try {
            const client = interaction.client;
            const uptime = client.uptime;
            
            const days = Math.floor(uptime / 86400000);
            const hours = Math.floor((uptime % 86400000) / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            
            const uptimeStr = days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
            
            const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            const totalChannels = client.channels.cache.size;
            
            const memUsage = process.memoryUsage();
            const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
            
const embed = AdvancedEmbed.commandSuccess('Operation Complete', 'Success');
        } catch (error) {
            console.error(`[Command Error] botinfo.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ content: `${emoji.error} Error getting bot info.`, flags: 64 }).catch(() => {});
            }
        }
    }
};
