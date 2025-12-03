const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');
const fs = require('fs');
const path = require('path');

function loadCommandsFromFiles() {
    const commands = {};
    const commandsPath = path.join(__dirname, '..');
    const categories = fs.readdirSync(commandsPath);
    
    const categoryConfig = {
        'moderation': { name: 'Moderation', emoji: emoji.moderation, color: emoji.color_moderation, description: 'Server safety and member management' },
        'leveling': { name: 'Leveling', emoji: emoji.leveling, color: emoji.color_leveling, description: 'Progression and ranking system' },
        'economy': { name: 'Economy', emoji: emoji.economy, color: emoji.color_economy, description: 'Coins, shop, and transactions' },
        'mail': { name: 'Mail System', emoji: emoji.mail, color: emoji.color_mail, description: 'Private messaging between members' },
        'games': { name: 'Mini-Games', emoji: emoji.games, color: emoji.color_games, description: 'Fun gaming commands' },
        'bot-dev': { name: 'Bot Utilities', emoji: emoji.botdev, color: emoji.color_success, description: 'Bot information and utilities' },
        'server-management': { name: 'Server Management', emoji: emoji.admin, color: emoji.color_moderation, description: 'Server configuration' },
        'fun': { name: 'Fun Commands', emoji: emoji.fun, color: emoji.color_fun, description: 'Entertainment and fun activities' }
    };
    
    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;
        
        const config = categoryConfig[category] || { 
            name: category.charAt(0).toUpperCase() + category.slice(1), 
            emoji: '📁', 
            color: emoji.color_info, 
            description: `${category} commands` 
        };
        
        commands[category] = {
            ...config,
            commands: []
        };
        
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            try {
                delete require.cache[require.resolve(path.join(categoryPath, file))];
                const command = require(path.join(categoryPath, file));
                if (command.data) {
                    commands[category].commands.push({
                        cmd: `/${command.data.name}`,
                        desc: command.data.description || 'No description'
                    });
                }
            } catch (error) {
                console.error(`Error loading command ${file}:`, error.message);
            }
        }
        
        if (commands[category].commands.length === 0) {
            delete commands[category];
        }
    }
    
    return commands;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available commands'),
    
    async execute(interaction) {
        try {
            const commands = loadCommandsFromFiles();
            const totalCommands = Object.values(commands).reduce((acc, cat) => acc + cat.commands.length, 0);

            const categoryFields = Object.entries(commands).map(([key, cat]) => ({
                name: `${cat.emoji} ${cat.name}`,
                value: `${cat.commands.length} cmds`,
                inline: true
            }));

            const mainEmbed = new EmbedBuilder()
                .setTitle(`${emoji.book} ${interaction.client.user.username} Commands`)
                .setDescription(`Select a category below to view commands.\n\n${emoji.star} **Total:** ${totalCommands} commands available`)
                .setColor(emoji.color_success)
                .addFields(categoryFields)
                .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
                .setFooter({ text: 'Use the dropdown to explore categories', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            const selectOptions = Object.entries(commands).map(([key, cat]) => ({
                label: cat.name,
                value: key,
                emoji: cat.emoji,
                description: cat.description.substring(0, 50)
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_select')
                .setPlaceholder('Select a category...')
                .addOptions(selectOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

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

                if (!category) {
                    return selectInteraction.reply({
                        content: `${emoji.error} Category not found.`,
                        flags: 64
                    });
                }

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
