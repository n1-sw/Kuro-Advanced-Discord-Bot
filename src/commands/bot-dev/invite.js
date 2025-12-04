const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the bot invite link and support info'),
    
    async execute(interaction) {
        try {
            const client = interaction.client;
            const clientId = client.user.id;
            const botName = client.user.username;
            
            const inviteLink = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
            
            const serverCount = client.guilds.cache.size;
            const userCount = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.links} Invite ${botName}`)
                .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                .setDescription(
                    `Add **${botName}** to your server and enjoy powerful moderation, leveling, economy, games, and more!\n\n` +
                    `${emoji.server} **Currently serving:** ${serverCount.toLocaleString()} servers\n` +
                    `${emoji.people} **Total users:** ${userCount.toLocaleString()} members\n\n` +
                    `Click the button below to add the bot to your server!`
                )
                .setColor(emoji.color_info)
                .addFields(
                    { 
                        name: `${emoji.star} Features`, 
                        value: 
                            `${emoji.moderation} Moderation & AutoMod\n` +
                            `${emoji.leveling} XP & Leveling System\n` +
                            `${emoji.economy} Economy & Shop\n` +
                            `${emoji.games} Fun Games & Trivia\n` +
                            `${emoji.mail} Mail System\n` +
                            `${emoji.gear} Server Management`,
                        inline: true 
                    },
                    { 
                        name: `${emoji.shield} Permissions`, 
                        value: 
                            `The bot requests Administrator\n` +
                            `permission for full functionality.\n` +
                            `You can customize permissions\n` +
                            `after adding the bot.`,
                        inline: true 
                    }
                )
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Invite Bot')
                        .setStyle(ButtonStyle.Link)
                        .setURL(inviteLink)
                        .setEmoji('🔗'),
                    new ButtonBuilder()
                        .setLabel('Vote for Us')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://top.gg/bot/${clientId}/vote`)
                        .setEmoji('⭐')
                );
            
            await interaction.reply({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error(`[Command Error] invite.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Error getting invite link.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
