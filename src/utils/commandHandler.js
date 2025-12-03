const fs = require('fs');
const path = require('path');
const { Collection, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const emoji = require('./emoji');
const { trackCommand, trackMemberHelped, trackTransaction } = require('./rpc');

const loadCommands = (client) => {
    client.commands = new Collection();
    
    const commandFolders = fs.readdirSync(path.join(__dirname, '../commands'));
    
    for (const folder of commandFolders) {
        const folderPath = path.join(__dirname, '../commands', folder);
        
        if (!fs.statSync(folderPath).isDirectory()) continue;
        
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            delete require.cache[require.resolve(path.join(folderPath, file))];
            const command = require(path.join(folderPath, file));
            
            if (command.data && command.data.name) {
                client.commands.set(command.data.name, command);
                console.log(`Loaded slash command: ${command.data.name}`);
            }
        }
    }
    
    console.log(`Total slash commands loaded: ${client.commands.size}`);
};

const reloadCommands = (client) => {
    console.log(`${emoji.refresh} Auto-reloading all commands...`);
    loadCommands(client);
    console.log(`${emoji.success} Commands reloaded!`);
};

const handleInteraction = async (interaction, client) => {
    if (interaction.isButton()) {
        await handleButtonInteraction(interaction, client);
        return;
    }
    
    if (interaction.isStringSelectMenu()) {
        return;
    }
    
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    
    try {
        trackCommand();
        
        if (interaction.commandName === 'ban' || interaction.commandName === 'kick' || 
            interaction.commandName === 'mute' || interaction.commandName === 'warn') {
            trackMemberHelped();
        }
        
        if (interaction.commandName === 'give' || interaction.commandName === 'buy' || 
            interaction.commandName === 'sell' || interaction.commandName === 'daily') {
            trackTransaction();
        }
        
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        
        if (client.webhookLogger && client.webhookLogger.enabled) {
            await client.webhookLogger.sendError(
                'Command Execution Error',
                `Command \`/${interaction.commandName}\` failed`,
                {
                    commandName: interaction.commandName,
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    errorCode: error.code,
                    stack: error.stack
                }
            );
        }
        
        try {
            if (interaction.replied) {
                await interaction.followUp({ content: 'There was an error executing this command.', flags: 64 }).catch(() => {});
            } else if (interaction.deferred) {
                await interaction.editReply({ content: 'There was an error executing this command.' }).catch(() => {});
            } else {
                await interaction.reply({ content: 'There was an error executing this command.', flags: 64 }).catch(() => {});
            }
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }
};

const handleButtonInteraction = async (interaction, client) => {
    try {
        if (interaction.customId === 'view_commands_help') {
            const commands = {
                moderation: {
                    name: `${emoji.moderation} Moderation`,
                    emoji: emoji.moderation,
                    color: 0xFF6B6B,
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
                    name: `${emoji.leveling} Leveling`,
                    emoji: emoji.leveling,
                    color: 0x4ECDC4,
                    description: 'Progression and ranking system',
                    commands: [
                        { cmd: '/rank', desc: 'Check your level and XP' },
                        { cmd: '/leaderboard', desc: 'View server leaderboard' }
                    ]
                },
                economy: {
                    name: `${emoji.economy} Economy`,
                    emoji: emoji.economy,
                    color: 0xFFD93D,
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
                games: {
                    name: `${emoji.games} Mini-Games`,
                    emoji: emoji.games,
                    color: 0xA78BFA,
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
                mail: {
                    name: `${emoji.mail} Mail System`,
                    emoji: emoji.mail,
                    color: 0x6BCB77,
                    description: 'Private messaging between members',
                    commands: [
                        { cmd: '/send', desc: 'Send private mail' },
                        { cmd: '/inbox', desc: 'View your inbox' },
                        { cmd: '/read', desc: 'Read a mail message' },
                        { cmd: '/deletemail', desc: 'Delete a mail' }
                    ]
                },
                botdev: {
                    name: `${emoji.botdev} Bot Utilities`,
                    emoji: emoji.botdev,
                    color: 0x43B581,
                    description: 'Bot information and utilities',
                    commands: [
                        { cmd: '/ping', desc: 'Check bot latency' },
                        { cmd: '/uptime', desc: 'View bot uptime' },
                        { cmd: '/botinfo', desc: 'View bot information' },
                        { cmd: '/invite', desc: 'Get invite link' },
                        { cmd: '/vote', desc: 'Vote for the bot' }
                    ]
                },
                server: {
                    name: `${emoji.admin} Server Management`,
                    emoji: emoji.admin,
                    color: 0xFF6B9D,
                    description: 'Server configuration',
                    commands: [
                        { cmd: '/welcome', desc: 'Set welcome/leave messages' },
                        { cmd: '/userinfo', desc: 'View user profile' },
                        { cmd: '/serverinfo', desc: 'View server info' },
                        { cmd: '/autoreact', desc: 'Setup auto-reactions' }
                    ]
                }
            };

            const mainEmbed = new EmbedBuilder()
                .setTitle(`${emoji.book} ${client.user.username} - Command Guide`)
                .setDescription(`Select a category below to explore commands.\n\n${emoji.star} **Total Commands:** 45+`)
                .setColor(0x5865F2)
                .addFields(
                    { name: `${emoji.moderation} Moderation`, value: '10 commands', inline: true },
                    { name: `${emoji.leveling} Leveling`, value: '2 commands', inline: true },
                    { name: `${emoji.economy} Economy`, value: '7 commands', inline: true },
                    { name: `${emoji.games} Mini-Games`, value: '7 commands', inline: true },
                    { name: `${emoji.mail} Mail System`, value: '4 commands', inline: true },
                    { name: `${emoji.botdev} Bot Utilities`, value: '5 commands', inline: true }
                )
                .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                .setFooter({ text: 'Use the dropdown to explore categories', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_select_from_invite')
                .setPlaceholder('Select a command category...')
                .addOptions([
                    { label: 'Moderation', value: 'moderation', emoji: emoji.moderation, description: 'Ban, kick, warn, and manage members' },
                    { label: 'Leveling', value: 'leveling', emoji: emoji.leveling, description: 'Check rank and view leaderboards' },
                    { label: 'Economy', value: 'economy', emoji: emoji.economy, description: 'Coins, shop, and rewards' },
                    { label: 'Mini-Games', value: 'games', emoji: emoji.games, description: 'Fun games to play' },
                    { label: 'Mail System', value: 'mail', emoji: emoji.mail, description: 'Send and receive messages' },
                    { label: 'Bot Utilities', value: 'botdev', emoji: emoji.botdev, description: 'Bot info and utilities' },
                    { label: 'Server Management', value: 'server', emoji: emoji.admin, description: 'Server configuration' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const response = await interaction.reply({
                embeds: [mainEmbed],
                components: [row],
                flags: 64
            });

            const collector = response.createMessageComponentCollector({ time: 180000 });

            collector.on('collect', async (selectInteraction) => {
                if (selectInteraction.user.id !== interaction.user.id) {
                    return selectInteraction.reply({ content: `${emoji.blocked} This menu is for ${interaction.user} only!`, flags: 64 });
                }

                const selected = selectInteraction.values[0];
                const category = commands[selected];

                const commandsList = category.commands
                    .map((cmd, idx) => `\`${idx + 1}.\` ${cmd.cmd} - ${cmd.desc}`)
                    .join('\n');

                const categoryEmbed = new EmbedBuilder()
                    .setTitle(`${category.emoji} ${category.name}`)
                    .setDescription(`**${category.description}**\n\n${commandsList}`)
                    .setColor(category.color)
                    .setFooter({ text: `${category.commands.length} commands available`, iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();

                await selectInteraction.update({ embeds: [categoryEmbed], components: [row] });
            });

            collector.on('end', () => {
                selectMenu.setDisabled(true);
                const disabledRow = new ActionRowBuilder().addComponents(selectMenu);
                response.edit({ components: [disabledRow] }).catch(() => {});
            });
        }
    } catch (error) {
        console.error('Button interaction error:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: `${emoji.error} An error occurred.`, flags: 64 }).catch(() => {});
        }
    }
};

module.exports = { loadCommands, reloadCommands, handleInteraction };
