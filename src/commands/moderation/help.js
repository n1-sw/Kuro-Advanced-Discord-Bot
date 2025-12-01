const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📖 View all available commands with detailed info'),
    
    async execute(interaction) {
        // Dynamic command data synced with actual commands
        const commands = {
            moderation: {
                name: `${emoji.moderation} Moderation`,
                emoji: emoji.moderation,
                color: 0xFF6B6B,
                icon: '🛡️',
                description: 'Server safety and member management',
                commands: [
                    { cmd: '/ban', desc: 'Ban a user from the server permanently' },
                    { cmd: '/kick', desc: 'Kick a user from the server' },
                    { cmd: '/mute', desc: 'Timeout a member (max 28 days)' },
                    { cmd: '/unmute', desc: 'Remove timeout from a user' },
                    { cmd: '/warn', desc: 'Warn a member with reason' },
                    { cmd: '/warnings', desc: 'View all warnings for a user' },
                    { cmd: '/clearwarnings', desc: 'Clear all warnings for a user' },
                    { cmd: '/modlogs', desc: 'View detailed moderation logs' },
                    { cmd: '/purge', desc: 'Delete 1-100 messages in bulk' },
                    { cmd: '/automod', desc: 'Configure auto-moderation settings' }
                ]
            },
            leveling: {
                name: `${emoji.leveling} Leveling`,
                emoji: emoji.leveling,
                color: 0x4ECDC4,
                icon: '📊',
                description: 'Progression and ranking system',
                commands: [
                    { cmd: '/rank', desc: 'Check your level, XP, and rank' },
                    { cmd: '/leaderboard', desc: 'View server leaderboard (levels/coins)' }
                ]
            },
            economy: {
                name: `${emoji.economy} Economy`,
                emoji: emoji.economy,
                color: 0xFFD93D,
                icon: '💰',
                description: 'Coins, shop, and transactions',
                commands: [
                    { cmd: '/balance', desc: 'Check your coin balance' },
                    { cmd: '/daily', desc: 'Claim daily reward + level bonus' },
                    { cmd: '/give', desc: 'Transfer coins to another user' },
                    { cmd: '/shop', desc: 'Browse items for purchase' },
                    { cmd: '/buy', desc: 'Purchase an item from the shop' },
                    { cmd: '/sell', desc: 'Sell inventory items (50% value)' },
                    { cmd: '/inventory', desc: 'View your purchased items' }
                ]
            },
            mail: {
                name: `${emoji.mail} Mail System`,
                emoji: emoji.mail,
                color: 0x6BCB77,
                icon: '📬',
                description: 'Private messaging between members',
                commands: [
                    { cmd: '/send', desc: 'Send private mail to another user' },
                    { cmd: '/inbox', desc: 'View your inbox with read/unread status' },
                    { cmd: '/read', desc: 'Read a specific mail message' },
                    { cmd: '/deletemail', desc: 'Delete a mail from your inbox' }
                ]
            },
            games: {
                name: `${emoji.games} Mini-Games`,
                emoji: emoji.games,
                color: 0xA78BFA,
                icon: '🎮',
                description: 'Fun gambling and gaming commands',
                commands: [
                    { cmd: '/coinflip', desc: 'Flip a coin and double or lose your bet' },
                    { cmd: '/dice', desc: 'Roll dice against the bot' },
                    { cmd: '/slots', desc: 'Play the 3-reel slot machine (10x jackpot!)' },
                    { cmd: '/gamble', desc: 'High-risk bet with 45% win chance (2x payout)' }
                ]
            },
            'botdev': {
                name: `${emoji.botdev} Bot Developer`,
                emoji: emoji.botdev,
                color: 0x43B581,
                icon: '⚙️',
                description: 'Bot utilities and information',
                commands: [
                    { cmd: '/ping', desc: 'Check bot latency and response time' },
                    { cmd: '/uptime', desc: 'View bot uptime and system stats' },
                    { cmd: '/botinfo', desc: 'View detailed bot information' },
                    { cmd: '/ownerinfo', desc: 'View bot owner information' },
                    { cmd: '/invite', desc: 'Get the bot invite link' },
                    { cmd: '/vote', desc: 'Vote for the bot on top.gg' },
                    { cmd: '/refresh', desc: 'Refresh bot systems and cache' },
                    { cmd: '/autosync', desc: 'Toggle auto-command sync' },
                    { cmd: '/autoupdate', desc: 'Toggle auto-update system' },
                    { cmd: '/updatecheck', desc: 'Check if bot updates are needed' }
                ]
            },
            'server-management': {
                name: `${emoji.admin} Server Management`,
                emoji: emoji.admin,
                color: 0xFF6B9D,
                icon: '👑',
                description: 'Server configuration and customization',
                commands: [
                    { cmd: '/welcome', desc: 'Set auto welcome/leave messages' },
                    { cmd: '/userinfo', desc: 'View detailed user profile info' },
                    { cmd: '/serverinfo', desc: 'View detailed server information' },
                    { cmd: '/autoreact', desc: 'Setup keyword emoji auto-reactions' }
                ]
            }
        };

        // Main embed with overview
        const mainEmbed = new EmbedBuilder()
            .setTitle(`🌟 ${interaction.client.user.username} - Command Center`)
            .setDescription(`
**Welcome to the Ultimate Command Guide!**

Select a category below to explore commands. This bot features:
✨ 42 Slash Commands | 🛡️ Advanced Moderation | 💰 Economy System
📊 Leveling System | 📬 Mail System | 🎮 Mini-Games | ⚙️ Auto Systems

*All features are fully functional and production-ready!*
            `)
            .setColor(0x2C2F33)
            .addFields(
                { name: '🛡️ Moderation', value: '10 commands', inline: true },
                { name: '📊 Leveling', value: '2 commands', inline: true },
                { name: '💰 Economy', value: '7 commands', inline: true },
                { name: '📬 Mail System', value: '4 commands', inline: true },
                { name: '🎮 Mini-Games', value: '4 commands', inline: true },
                { name: '⚙️ Bot Developer', value: '10 commands', inline: true },
                { name: '👑 Server Management', value: '4 commands', inline: true },
                { name: '📈 Total Commands', value: '**42 Commands**', inline: false }
            )
            .setFooter({ text: '✨ Click the dropdown to explore categories ✨', iconURL: interaction.client.user.displayAvatarURL() })
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
            .setTimestamp();

        // Select menu options
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_select')
            .setPlaceholder('📚 Select a command category...')
            .addOptions([
                {
                    label: '🛡️ Moderation',
                    value: 'moderation',
                    emoji: emoji.moderation,
                    description: 'Ban, kick, warn, and manage members'
                },
                {
                    label: '📊 Leveling',
                    value: 'leveling',
                    emoji: emoji.leveling,
                    description: 'Check rank and view leaderboards'
                },
                {
                    label: '💰 Economy',
                    value: 'economy',
                    emoji: emoji.economy,
                    description: 'Coins, shop, buy, sell, and rewards'
                },
                {
                    label: '📬 Mail System',
                    value: 'mail',
                    emoji: emoji.mail,
                    description: 'Send and receive private messages'
                },
                {
                    label: '🎮 Mini-Games',
                    value: 'games',
                    emoji: emoji.games,
                    description: 'Coinflip, dice, slots, and gambling'
                },
                {
                    label: '⚙️ Bot Developer',
                    value: 'botdev',
                    emoji: emoji.botdev,
                    description: 'Bot utilities and information'
                },
                {
                    label: '👑 Server Management',
                    value: 'server-management',
                    emoji: emoji.admin,
                    description: 'Configure welcome, auto-react, and more'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        try {
            const response = await interaction.reply({
                embeds: [mainEmbed],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({
                time: 180000 // 3 minutes
            });

            collector.on('collect', async (selectInteraction) => {
                if (selectInteraction.user.id !== interaction.user.id) {
                    return selectInteraction.reply({
                        content: `${emoji.blocked} This menu is for ${interaction.user} only!`,
                        flags: 64
                    });
                }

                const selected = selectInteraction.values[0];
                const category = commands[selected];

                // Build command list with better formatting
                const commandsList = category.commands
                    .map((cmd, idx) => `\`${String(idx + 1).padStart(2, '0')}.\` ${cmd.cmd}\n   ➜ ${cmd.desc}`)
                    .join('\n\n');

                const categoryEmbed = new EmbedBuilder()
                    .setTitle(`${category.emoji} ${category.name}`)
                    .setDescription(`
${category.icon} **${category.description}**
${'━'.repeat(50)}

${commandsList}

${'━'.repeat(50)}
                    `)
                    .setColor(category.color)
                    .setFooter({ text: `${category.commands.length} commands available • Use the dropdown to switch categories`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                await selectInteraction.update({
                    embeds: [categoryEmbed],
                    components: [row]
                });
            });

            collector.on('end', () => {
                selectMenu.setDisabled(true);
                const disabledRow = new ActionRowBuilder().addComponents(selectMenu);
                response.edit({ components: [disabledRow] }).catch(() => {});
            });
        } catch (error) {
            console.error('Help command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setTitle(`${emoji.error} Error`)
                        .setDescription('Failed to display help menu')
                        .setColor(0xFF0000)
                    ], 
                    flags: 64 
                });
            }
        }
    }
};
