const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available commands'),
    
    async execute(interaction) {
        const commands = {
            moderation: {
                name: 'Moderation',
                emoji: emoji.moderation,
                color: emoji.color_error,
                description: 'Server safety and member management',
                commands: [
                    { cmd: '/ban', desc: 'Ban a user from the server' },
                    { cmd: '/kick', desc: 'Kick a user from the server' },
                    { cmd: '/mute', desc: 'Timeout a member' },
                    { cmd: '/unmute', desc: 'Remove timeout from a user' },
                    { cmd: '/warn', desc: 'Warn a member' },
                    { cmd: '/warnings', desc: 'View warnings for a user' },
                    { cmd: '/clearwarnings', desc: 'Clear all warnings' },
                    { cmd: '/modlogs', desc: 'View moderation logs' },
                    { cmd: '/purge', desc: 'Delete messages in bulk' },
                    { cmd: '/automod', desc: 'Configure auto-moderation' }
                ]
            },
            leveling: {
                name: 'Leveling',
                emoji: emoji.leveling,
                color: emoji.color_success,
                description: 'Progression and ranking system',
                commands: [
                    { cmd: '/rank', desc: 'View your detailed rank card' },
                    { cmd: '/leaderboard', desc: 'View server leaderboard' }
                ]
            },
            economy: {
                name: 'Economy',
                emoji: emoji.economy,
                color: emoji.color_warning,
                description: 'Coins, shop, and transactions',
                commands: [
                    { cmd: '/balance', desc: 'Check your coin balance' },
                    { cmd: '/daily', desc: 'Claim daily reward' },
                    { cmd: '/give', desc: 'Transfer coins to another user' },
                    { cmd: '/shop', desc: 'Browse items for purchase' },
                    { cmd: '/buy', desc: 'Purchase an item' },
                    { cmd: '/sell', desc: 'Sell inventory items' },
                    { cmd: '/inventory', desc: 'View your items' }
                ]
            },
            mail: {
                name: 'Mail System',
                emoji: emoji.mail,
                color: emoji.color_info,
                description: 'Private messaging between members',
                commands: [
                    { cmd: '/send', desc: 'Send private mail' },
                    { cmd: '/inbox', desc: 'View your inbox' },
                    { cmd: '/read', desc: 'Read a mail message' },
                    { cmd: '/deletemail', desc: 'Delete a mail' }
                ]
            },
            games: {
                name: 'Mini-Games',
                emoji: emoji.games,
                color: emoji.color_primary,
                description: 'Fun gaming commands',
                commands: [
                    { cmd: '/coinflip', desc: 'Flip a coin and bet' },
                    { cmd: '/dice', desc: 'Roll dice against the bot' },
                    { cmd: '/slots', desc: 'Play slot machine' },
                    { cmd: '/gamble', desc: 'High-risk betting' },
                    { cmd: '/snake', desc: 'Play Snake game' },
                    { cmd: '/tictactoe', desc: 'Play Tic-Tac-Toe' },
                    { cmd: '/chess', desc: 'Play Chess' }
                ]
            },
            botdev: {
                name: 'Bot Utilities',
                emoji: emoji.botdev,
                color: emoji.color_success,
                description: 'Bot information and utilities',
                commands: [
                    { cmd: '/ping', desc: 'Check bot latency' },
                    { cmd: '/uptime', desc: 'View bot uptime' },
                    { cmd: '/botinfo', desc: 'View bot information' },
                    { cmd: '/ownerinfo', desc: 'View bot owner info' },
                    { cmd: '/invite', desc: 'Get invite link' },
                    { cmd: '/vote', desc: 'Vote for the bot' },
                    { cmd: '/refresh', desc: 'Refresh bot systems' },
                    { cmd: '/autosync', desc: 'Toggle auto-sync' },
                    { cmd: '/autoupdate', desc: 'Toggle auto-update' },
                    { cmd: '/updatecheck', desc: 'Check for updates' }
                ]
            },
            'server-management': {
                name: 'Server Management',
                emoji: emoji.admin,
                color: emoji.color_error,
                description: 'Server configuration',
                commands: [
                    { cmd: '/welcome', desc: 'Set welcome/leave messages' },
                    { cmd: '/userinfo', desc: 'View user profile' },
                    { cmd: '/serverinfo', desc: 'View server info' },
                    { cmd: '/autoreact', desc: 'Setup auto-reactions' }
                ]
            }
        };

        const totalCommands = Object.values(commands).reduce((acc, cat) => acc + cat.commands.length, 0);

        const mainEmbed = new EmbedBuilder()
            .setTitle(`${emoji.book} ${interaction.client.user.username} Commands`)
            .setDescription(`Select a category below to view commands.\n\n${emoji.star} **Total:** ${totalCommands} commands available`)
            .setColor(emoji.color_success)
            .addFields(
                { name: `${emoji.moderation} Moderation`, value: `${commands.moderation.commands.length} cmds`, inline: true },
                { name: `${emoji.leveling} Leveling`, value: `${commands.leveling.commands.length} cmds`, inline: true },
                { name: `${emoji.economy} Economy`, value: `${commands.economy.commands.length} cmds`, inline: true },
                { name: `${emoji.mail} Mail`, value: `${commands.mail.commands.length} cmds`, inline: true },
                { name: `${emoji.games} Games`, value: `${commands.games.commands.length} cmds`, inline: true },
                { name: `${emoji.botdev} Utilities`, value: `${commands.botdev.commands.length} cmds`, inline: true },
                { name: `${emoji.admin} Server`, value: `${commands['server-management'].commands.length} cmds`, inline: true }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: 'Use the dropdown to explore categories', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_select')
            .setPlaceholder('Select a category...')
            .addOptions([
                { label: 'Moderation', value: 'moderation', emoji: emoji.moderation, description: 'Ban, kick, warn, mute' },
                { label: 'Leveling', value: 'leveling', emoji: emoji.leveling, description: 'Rank and leaderboards' },
                { label: 'Economy', value: 'economy', emoji: emoji.economy, description: 'Coins and shop' },
                { label: 'Mail System', value: 'mail', emoji: emoji.mail, description: 'Private messages' },
                { label: 'Mini-Games', value: 'games', emoji: emoji.games, description: 'Fun games to play' },
                { label: 'Bot Utilities', value: 'botdev', emoji: emoji.botdev, description: 'Bot info and settings' },
                { label: 'Server Management', value: 'server-management', emoji: emoji.admin, description: 'Server configuration' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        try {
            const response = await interaction.reply({
                embeds: [mainEmbed],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({ time: 180000 });

            collector.on('collect', async (selectInteraction) => {
                if (selectInteraction.user.id !== interaction.user.id) {
                    return selectInteraction.reply({
                        content: `${emoji.error} This menu is for ${interaction.user} only!`,
                        flags: 64
                    });
                }

                const selected = selectInteraction.values[0];
                const category = commands[selected];

                const commandsList = category.commands
                    .map((cmd, idx) => `\`${idx + 1}.\` **${cmd.cmd}** - ${cmd.desc}`)
                    .join('\n');

                const categoryEmbed = new EmbedBuilder()
                    .setTitle(`${category.emoji} ${category.name}`)
                    .setDescription(`**${category.description}**\n\n${commandsList}`)
                    .setColor(category.color)
                    .setFooter({ text: `${category.commands.length} commands`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                await selectInteraction.update({ embeds: [categoryEmbed], components: [row] });
            });

            collector.on('end', () => {
                selectMenu.setDisabled(true);
                const disabledRow = new ActionRowBuilder().addComponents(selectMenu);
                response.edit({ components: [disabledRow] }).catch(() => {});
            });
        } catch (error) {
            console.error(`[Command Error] help.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to display help menu.`, 
                    flags: 64 
                });
            }
        }
    }
};
