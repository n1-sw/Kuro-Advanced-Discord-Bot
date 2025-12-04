const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ownerinfo')
        .setDescription('View information about the bot owner'),
    
    async execute(interaction) {
        try {
            const client = interaction.client;
            const ownerId = '698131338846404609';
            
            let owner;
            try {
                owner = await client.users.fetch(ownerId);
            } catch (fetchError) {
                const embed = new EmbedBuilder()
                    .setTitle(`${emoji.owner} Bot Owner Information`)
                    .setDescription('The bot owner information could not be fetched at this time.')
                    .setColor(emoji.color_warning)
                    .addFields(
                        { name: 'Owner ID', value: `\`${ownerId}\``, inline: true },
                        { name: 'Status', value: `${emoji.developer} Developer`, inline: true },
                        { name: 'Role', value: 'Bot Creator & Maintainer', inline: true }
                    )
                    .setFooter({ text: 'For support or inquiries, contact the owner' })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.owner} Bot Owner Information`)
                .setThumbnail(owner.displayAvatarURL({ size: 256 }))
                .setColor(0x7289da)
                .addFields(
                    { name: `${emoji.person} Owner Name`, value: `\`${owner.username}\``, inline: true },
                    { name: `${emoji.id} Owner ID`, value: `\`${owner.id}\``, inline: true },
                    { name: `${emoji.calendar} Account Created`, value: `<t:${Math.floor(owner.createdTimestamp / 1000)}:D>`, inline: true },
                    { name: `${emoji.developer} Status`, value: 'Developer', inline: true },
                    { name: `${emoji.crown} Role`, value: 'Bot Creator & Maintainer', inline: true },
                    { name: `${emoji.star} Bot Stats`, value: `Serving ${client.guilds.cache.size} servers`, inline: true }
                )
                .setFooter({ text: 'For support or inquiries, contact the owner' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] ownerinfo.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Could not fetch owner information.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
