const { EmbedBuilder } = require('discord.js');

const emoji = require('../utils/emoji');
module.exports = {
    async execute(guild, client) {
        try {
            const owner = await guild.fetchOwner().catch(() => null);
            
            if (owner && owner.user) {
                const embed = new EmbedBuilder()
                    .setTitle(`${emoji.party} Thank You for Adding Me!`)
                    .setDescription(`Thank you for inviting **${client.user.username}** to **${guild.name}**!`)
                    .setColor(0x00FF00)
                    .addFields(
                        { name: `${emoji.book} Getting Started`, value: 'Type `/help` in your server to see all available commands!' },
                        { name: `${emoji.shield} Features`, value: '• Moderation & Anti-nuke Protection\n• Leveling System with XP\n• Economy System with Coins\n• Mail System\n• Mini-Games' },
                        { name: `${emoji.bulb} Commands`, value: `I have **${client.commands.size} commands** ready to use!` },
                        { name: `${emoji.links} Useful Links`, value: '• `/help` - View all commands\n• `/botinfo` - Bot information\n• `/invite` - Invite me to other servers\n• `/vote` - Vote for me on top.gg' }
                    )
                    .setThumbnail(client.user.displayAvatarURL())
                    .setFooter({ text: 'Need help? Use /help command in your server!' })
                    .setTimestamp();

                await owner.send({ embeds: [embed] }).catch(err => {
                    console.log(`Could not DM owner of ${guild.name}`);
                });

                console.log(`${emoji.success} Thank you DM sent to ${owner.user.tag} for server: ${guild.name}`);
            }

            console.log(`${emoji.success} Bot added to server: ${guild.name} (${guild.memberCount} members)`);
        } catch (error) {
            console.error('Guild Create event error:', error);
        }
    }
};
