const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('Auto-refresh and display all loaded commands'),
    
    async execute(interaction, client) {
        try {
            await interaction.deferReply();
            
            client.reloadCommands();
            
            const commands = client.commands;
            const totalCommands = commands.size;
            
            const categories = {
                'moderation': [],
                'leveling': [],
                'economy': [],
                'mail': [],
                'games': [],
                'bot-dev': []
            };
            
            commands.forEach((cmd, name) => {
                const folderName = Array.from(Object.keys(categories)).find(cat => {
                    return ['ban', 'kick', 'mute', 'unmute', 'warn', 'warnings', 'clearwarnings', 'modlogs', 'purge', 'help'].includes(name) && cat === 'moderation' ||
                           ['rank', 'leaderboard'].includes(name) && cat === 'leveling' ||
                           ['balance', 'daily', 'give', 'shop', 'buy', 'sell', 'inventory'].includes(name) && cat === 'economy' ||
                           ['send', 'inbox', 'read', 'deletemail'].includes(name) && cat === 'mail' ||
                           ['coinflip', 'dice', 'slots', 'gamble'].includes(name) && cat === 'games' ||
                           ['botinfo', 'ownerinfo', 'invite', 'vote', 'ping', 'uptime', 'refresh'].includes(name) && cat === 'bot-dev';
                });
                
                if (folderName) {
                    categories[folderName].push(name);
                }
            });
            
            const commandList = Object.entries(categories)
                .filter(([_, cmds]) => cmds.length > 0)
                .map(([category, cmds]) => {
                    const categoryEmoji = emoji.getCategory(category);
                    
                    return `${categoryEmoji} **${category.toUpperCase()}** (${cmds.length})\n\`${cmds.map(c => `/${c}`).join(', ')}\``;
                })
                .join('\n\n');
            
            const embed = createEmbed({
                title: `${emoji.refresh} Commands Auto-Refreshed`,
                description: `**Total Commands Loaded: ${totalCommands}**\n\n${commandList}`,
                color: 0x00FF00,
                fields: [
                    { name: `${emoji.success} Status`, value: 'All commands reloaded and ready!', inline: true },
                    { name: `${emoji.announcement} Bot`, value: `${client.user.username}#${client.user.discriminator}`, inline: true },
                    { name: `${emoji.server} Servers`, value: `${client.guilds.cache.size}`, inline: true }
                ],
                footer: 'Auto-refresh complete!'
            });
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Refresh command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error refreshing commands.', flags: 64 }).catch(() => {});
            }
        }
    }
};
