const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/helpers');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('Auto-refresh and display all loaded commands'),
    
    async execute(interaction, client) {
        try {
            await interaction.deferReply();
            
            if (!client || !client.reloadCommands || !client.commands) {
                throw new Error('Client or commands not available');
            }
            
            client.reloadCommands();
            
            const commands = client.commands || new Map();
            const totalCommands = commands.size || 0;
            
            const categories = {
                'moderation': [],
                'leveling': [],
                'economy': [],
                'mail': [],
                'games': [],
                'bot-dev': [],
                'server-management': []
            };
            
            commands.forEach((cmd, name) => {
                const folderName = Array.from(Object.keys(categories)).find(cat => {
                    return ['ban', 'kick', 'mute', 'unmute', 'warn', 'warnings', 'clearwarnings', 'modlogs', 'purge', 'help', 'automod'].includes(name) && cat === 'moderation' ||
                           ['rank', 'leaderboard', 'rankconfig'].includes(name) && cat === 'leveling' ||
                           ['balance', 'daily', 'give', 'shop', 'buy', 'sell', 'inventory'].includes(name) && cat === 'economy' ||
                           ['send', 'inbox', 'read', 'deletemail'].includes(name) && cat === 'mail' ||
                           ['coinflip', 'dice', 'slots', 'gamble', 'snake', 'chess', 'tictactoe'].includes(name) && cat === 'games' ||
                           ['botinfo', 'ownerinfo', 'invite', 'vote', 'ping', 'uptime', 'refresh', 'autosync', 'autoupdate', 'updatecheck'].includes(name) && cat === 'bot-dev' ||
                           ['userinfo', 'serverinfo', 'welcome', 'autoreact'].includes(name) && cat === 'server-management';
                });
                
                if (folderName) {
                    categories[folderName].push(name);
                }
            });
            
            const commandList = Object.entries(categories)
                .filter(([_, cmds]) => cmds.length > 0)
                .map(([category, cmds]) => {
                    const categoryEmoji = emoji.getCategory(category) || '•';
                    return `${categoryEmoji} **${category.toUpperCase()}** (${cmds.length})\n\`${cmds.map(c => `/${c}`).join(', ')}\``;
                })
                .join('\n\n');
            
            const embed = createEmbed({
                title: `${emoji.refresh || '🔄'} Commands Auto-Refreshed`,
                description: `**Total Commands Loaded: ${totalCommands}**\n\n${commandList || 'No commands loaded'}`,
                color: emoji.color_success || 0x00FF00,
                fields: [
                    { name: `${emoji.success || '✅'} Status`, value: 'All commands reloaded and ready!', inline: true },
                    { name: `${emoji.announcement || '📢'} Bot`, value: `${client.user?.username || 'Bot'}#${client.user?.discriminator || '0000'}`, inline: true },
                    { name: `${emoji.server || '🖥️'} Servers`, value: `${client.guilds?.cache?.size || 0}`, inline: true }
                ],
                footer: 'Auto-refresh complete!'
            });
            
            await interaction.editReply({ embeds: [embed] }).catch(async () => {
                await interaction.editReply({ content: `${emoji.success || '✅'} Commands refreshed: ${totalCommands} loaded` });
            });
        } catch (error) {
            console.error('[refresh.js]', error.message);
            const embed = AdvancedEmbed.commandError('Refresh Failed', error.message || 'Could not refresh commands');
            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] }).catch(() => {
                    interaction.editReply({ content: '❌ Failed to refresh commands' });
                });
            } else if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {
                    interaction.reply({ content: '❌ Failed to refresh commands', flags: 64 });
                });
            }
        }
    }
};
