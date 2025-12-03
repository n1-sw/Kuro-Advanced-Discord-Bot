const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, errorEmbed } = require('../../utils/helpers');
const { users } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('View detailed user profile information')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check (leave empty for yourself)')
                .setRequired(false)),
    
    async execute(interaction) {
        try {
            const target = interaction.options.getMember('user') || interaction.member;
            const userData = await users.get(interaction.guild.id, target.id);
            
            const embed = createEmbed({
                title: `${target.user.username}'s Profile`,
                thumbnail: target.user.displayAvatarURL(),
                color: 0x7289da,
                fields: [
                    { name: 'User ID', value: target.id, inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:d>`, inline: true },
                    { name: 'Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:d>`, inline: true },
                    { name: 'Level', value: String(userData.level || 0), inline: true },
                    { name: 'Total XP', value: String(userData.xp || 0), inline: true },
                    { name: 'Balance', value: `${userData.coins || 0} coins`, inline: true },
                    { name: 'Messages', value: String(userData.totalMessages || 0), inline: true },
                    { name: 'Warnings', value: String((userData.warnings || []).length), inline: true },
                    { name: 'Inventory', value: `${(userData.inventory || []).length} item(s)`, inline: true }
                ]
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] userinfo.js:`, error.message);
            await interaction.reply({
                embeds: [errorEmbed('Error retrieving user information.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
