const { EmbedBuilder } = require('discord.js');
const { users } = require('../utils/database');

const emoji = require('../utils/emoji');
module.exports = {
    async execute(member, client) {
        try {
            if (member.user.bot) return;

            const userData = users.get(member.guild.id, member.id);
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.party} Welcome to ${member.guild.name}!`)
                .setDescription(`Welcome **${member.user.username}**! Glad you joined us!`)
                .setColor(0x00FF00)
                .addFields(
                    { name: `${emoji.bot} Bot Features`, value: `This server uses **${client.user.username}}** - A feature-rich Discord bot!` },
                    { name: `${emoji.book} Getting Started`, value: 'Type `/help` to see all available commands!' },
                    { name: `${emoji.shield} What I Offer`, value: '• Moderation & Anti-nuke Protection\n• Leveling System (Gain XP by chatting)\n• Economy System (Earn coins & shop)\n• Mail System (Send private messages)\n• Mini-Games (Coinflip, Dice, Slots, Gamble)' },
                    { name: `${emoji.bulb} Quick Commands`, value: '• `/rank` - Check your level\n• `/balance` - Check your coins\n• `/help` - View all commands\n• `/daily` - Claim daily reward' },
                    { name: `${emoji.members} Server Info`, value: `Members: ${member.guild.memberCount}` }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setFooter({ text: 'Have fun and respect the rules!' })
                .setTimestamp();

            await member.send({ embeds: [embed] }).catch(() => {
                console.log(`Could not DM ${member.user.tag} on join`);
            });

            console.log(`${emoji.success} Welcome DM sent to ${member.user.tag} in server: ${member.guild.name}`);
        } catch (error) {
            console.error('Guild Member Add event error:', error);
        }
    }
};
