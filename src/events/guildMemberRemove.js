const { EmbedBuilder } = require('discord.js');
const emoji = require('../utils/emoji');
const fs = require('fs');
const path = require('path');

const configFile = path.join(__dirname, '../data/welcome.json');

const loadWelcomeConfig = () => {
    try {
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading welcome config:', error);
    }
    return {};
};

module.exports = {
    async execute(member, client) {
        try {
            if (member.user.bot) return;

            const config = loadWelcomeConfig();
            const guildConfig = config[member.guild.id];

            if (guildConfig && guildConfig.leave && guildConfig.leave.enabled && guildConfig.leave.channelId) {
                const channel = member.guild.channels.cache.get(guildConfig.leave.channelId);
                
                if (channel) {
                    const message = (guildConfig.leave.message || 'Goodbye {user}! We now have {membercount} members.')
                        .replace('{user}', member.user.username)
                        .replace('{server}', member.guild.name)
                        .replace('{membercount}', member.guild.memberCount.toString());

                    const embed = new EmbedBuilder()
                        .setTitle(`${emoji.warning} Goodbye!`)
                        .setDescription(message)
                        .setColor(0xFF6B6B)
                        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                        .addFields(
                            { name: 'Member', value: `${member.user.tag}`, inline: true },
                            { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
                        )
                        .setFooter({ text: `ID: ${member.user.id}` })
                        .setTimestamp();

                    await channel.send({ embeds: [embed] }).catch(console.error);
                    console.log(`${emoji.warning} Leave message sent for ${member.user.tag}`);
                }
            }

        } catch (error) {
            console.error('Guild Member Remove event error:', error);
        }
    }
};
