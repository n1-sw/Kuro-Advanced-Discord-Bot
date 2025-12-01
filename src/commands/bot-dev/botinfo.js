const { SlashCommandBuilder, version } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('View information about the bot'),
    
    async execute(interaction) {
        try {
            const client = interaction.client;
            const uptime = client.uptime;
            
            const uptimeHours = Math.floor(uptime / 3600000);
            const uptimeMinutes = Math.floor((uptime % 3600000) / 60000);
            
            const embed = createEmbed({
                title: `${emoji.bot} Bot Information`,
                thumbnail: client.user.displayAvatarURL(),
                fields: [
                    { name: 'Bot Name', value: client.user.username, inline: true },
                    { name: 'Bot ID', value: client.user.id, inline: true },
                    { name: 'Discord.js Version', value: `v${version}`, inline: true },
                    { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
                    { name: 'Users', value: `${client.users.cache.size}`, inline: true },
                    { name: 'Uptime', value: `${uptimeHours}h ${uptimeMinutes}m`, inline: true },
                    { name: 'Prefix', value: 'Slash Commands Only', inline: true },
                    { name: 'Commands', value: '34 Total', inline: true }
                ],
                color: 0x2F3136
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Botinfo command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error getting bot info.', flags: 64 }).catch(() => {});
            }
        }
    }
};
