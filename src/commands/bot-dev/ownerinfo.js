const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ownerinfo')
        .setDescription('View information about the bot owner'),
    
    async execute(interaction) {
        const client = interaction.client;
        const ownerId = '698131338846404609';
        
        try {
            const owner = await client.users.fetch(ownerId);
            
            const embed = createEmbed({
                title: `${emoji.person} Bot Owner Information`,
                thumbnail: owner.displayAvatarURL(),
                fields: [
                    { name: 'Owner Name', value: owner.username, inline: true },
                    { name: 'Owner ID', value: owner.id, inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(owner.createdTimestamp / 1000)}:D>`, inline: false },
                    { name: 'Status', value: `${emoji.developer} Developer`, inline: true },
                    { name: 'Role', value: 'Bot Creator & Maintainer', inline: true }
                ],
                color: 0x7289da,
                footer: 'For support or inquiries, contact the owner'
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] ownerinfo.js:`, error.message);
            await interaction.reply({ content: 'Could not fetch owner information.', flags: 64 });
        }
    }
};
