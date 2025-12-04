const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('View information about a role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to get information about')
                .setRequired(true)),
    
    async execute(interaction) {
        try {
            const role = interaction.options.getRole('role');
            
            const permissions = role.permissions.toArray();
            const keyPerms = permissions.filter(p => 
                ['Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels', 
                 'KickMembers', 'BanMembers', 'ModerateMembers', 'ManageMessages',
                 'MentionEveryone', 'ManageWebhooks'].includes(p)
            );
            
            const memberCount = role.members.size;
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.gear} Role Information`)
                .setColor(role.color || emoji.color_info)
                .addFields(
                    { 
                        name: `${emoji.id} Role Name`, 
                        value: `\`${role.name}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.id} Role ID`, 
                        value: `\`${role.id}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.sparkles} Color`, 
                        value: `\`${role.hexColor}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.people} Members`, 
                        value: `\`${memberCount.toLocaleString()}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.chart} Position`, 
                        value: `\`${role.position}\``, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.megaphone} Mentionable`, 
                        value: role.mentionable ? `${emoji.success} Yes` : `${emoji.error} No`, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.star} Hoisted`, 
                        value: role.hoist ? `${emoji.success} Yes` : `${emoji.error} No`, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.bot} Managed`, 
                        value: role.managed ? `${emoji.success} Yes` : `${emoji.error} No`, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.calendar} Created`, 
                        value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, 
                        inline: true 
                    },
                    { 
                        name: `${emoji.shield} Key Permissions (${keyPerms.length})`, 
                        value: keyPerms.length > 0 
                            ? keyPerms.map(p => `\`${p}\``).join(', ').substring(0, 1024) 
                            : 'None', 
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
            console.error(`[Command Error] roleinfo.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to get role information.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
