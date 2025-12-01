const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('View detailed server information'),
    
    async execute(interaction) {
        try {
            const guild = interaction.guild;
            
            const embed = createEmbed({
                title: `${guild.name} Information`,
                thumbnail: guild.iconURL(),
                color: 0x00ff00,
                fields: [
                    { name: 'Server ID', value: guild.id, inline: true },
                    { name: 'Owner', value: (await guild.fetchOwner()).user.tag, inline: true },
                    { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:d>`, inline: true },
                    { name: 'Member Count', value: String(guild.memberCount), inline: true },
                    { name: 'Channels', value: String(guild.channels.cache.size), inline: true },
                    { name: 'Roles', value: String(guild.roles.cache.size), inline: true },
                    { name: 'Verification Level', value: guild.verificationLevel || 'None', inline: true },
                    { name: 'Region', value: guild.preferredLocale || 'Auto-detected', inline: true }
                ]
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in serverinfo command:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error retrieving server information.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
