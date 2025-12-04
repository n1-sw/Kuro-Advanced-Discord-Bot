const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('View a user\'s avatar')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get the avatar of'))
        .addBooleanOption(option =>
            option.setName('server')
                .setDescription('Show server avatar instead of global avatar')),
    
    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user') || interaction.user;
            const showServer = interaction.options.getBoolean('server') ?? false;
            
            let avatarUrl;
            let avatarType = 'Global';
            
            if (showServer && interaction.guild) {
                try {
                    const member = await interaction.guild.members.fetch(user.id);
                    if (member.avatar) {
                        avatarUrl = member.displayAvatarURL({ size: 4096, dynamic: true });
                        avatarType = 'Server';
                    } else {
                        avatarUrl = user.displayAvatarURL({ size: 4096, dynamic: true });
                    }
                } catch {
                    avatarUrl = user.displayAvatarURL({ size: 4096, dynamic: true });
                }
            } else {
                avatarUrl = user.displayAvatarURL({ size: 4096, dynamic: true });
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.person} ${user.username}'s Avatar`)
                .setDescription(`${avatarType} avatar for **${user.tag}**`)
                .setImage(avatarUrl)
                .setColor(emoji.color_info)
                .addFields(
                    { 
                        name: `${emoji.links} Links`, 
                        value: `[PNG](${user.displayAvatarURL({ size: 4096, extension: 'png' })}) | [JPG](${user.displayAvatarURL({ size: 4096, extension: 'jpg' })}) | [WEBP](${user.displayAvatarURL({ size: 4096, extension: 'webp' })})`,
                        inline: false 
                    }
                )
                .setFooter({ 
                    text: `Requested by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] avatar.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to get avatar.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
