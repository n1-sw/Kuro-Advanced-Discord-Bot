const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/helpers');
const fs = require('fs');
const path = require('path');

const configFile = path.join(__dirname, '../../data/autoreact.json');

const loadAutoReactConfig = () => {
    try {
        if (!fs.existsSync(path.dirname(configFile))) {
            fs.mkdirSync(path.dirname(configFile), { recursive: true });
        }
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading autoreact config:', error);
    }
    return {};
};

const saveAutoReactConfig = (config) => {
    try {
        fs.mkdirSync(path.dirname(configFile), { recursive: true });
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving autoreact config:', error);
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoreact')
        .setDescription('Manage auto-react emoji system')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add keyword auto-reaction')
                .addStringOption(opt =>
                    opt.setName('keyword')
                        .setDescription('Keyword to trigger reaction')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('emoji')
                        .setDescription('Emoji to auto-react with')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove auto-reaction')
                .addStringOption(opt =>
                    opt.setName('keyword')
                        .setDescription('Keyword to remove')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all auto-reactions'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const config = loadAutoReactConfig();
            const guildId = interaction.guild.id;
            const subcommand = interaction.options.getSubcommand();
            
            if (!config[guildId]) {
                config[guildId] = {};
            }
            
            if (subcommand === 'add') {
                const keyword = interaction.options.getString('keyword').toLowerCase();
                const emoji = interaction.options.getString('emoji');
                
                if (emoji.length > 2) {
                    return interaction.reply({
                        embeds: [errorEmbed('Please provide a single emoji!')],
                        flags: 64
                    });
                }
                
                config[guildId][keyword] = emoji;
                saveAutoReactConfig(config);
                
                await interaction.reply({
                    embeds: [successEmbed(`Added auto-reaction: **${keyword}** → ${emoji}`)],
                    flags: 64
                });
            } else if (subcommand === 'remove') {
                const keyword = interaction.options.getString('keyword').toLowerCase();
                
                if (config[guildId][keyword]) {
                    delete config[guildId][keyword];
                    saveAutoReactConfig(config);
                    
                    await interaction.reply({
                        embeds: [successEmbed(`Removed auto-reaction for **${keyword}**`)],
                        flags: 64
                    });
                } else {
                    await interaction.reply({
                        embeds: [errorEmbed(`No auto-reaction found for **${keyword}**`)],
                        flags: 64
                    });
                }
            } else if (subcommand === 'list') {
                const reactions = Object.entries(config[guildId]);
                
                if (reactions.length === 0) {
                    return interaction.reply({
                        embeds: [createEmbed({ title: 'Auto-Reactions', description: 'No auto-reactions configured.', color: 0x808080 })],
                        flags: 64
                    });
                }
                
                const list = reactions.map(([kw, em]) => `**${kw}** → ${em}`).join('\n');
                const embed = createEmbed({
                    title: 'Auto-Reactions',
                    description: list,
                    color: 0x0099ff,
                    footer: `Total: ${reactions.length}`
                });
                
                await interaction.reply({ embeds: [embed], flags: 64 });
            }
        } catch (error) {
            console.error('Error in autoreact command:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error managing auto-reactions.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
