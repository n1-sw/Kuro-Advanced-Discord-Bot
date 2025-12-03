const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');
const fs = require('fs');
const path = require('path');

const configFile = path.join(__dirname, '../../data/autoreact.json');

const defaultEmojis = ['😀', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯', '🙌', '👀', '💪', '🤩', '😎', '🥳', '💖', '⭐', '🌟', '💫', '🎯', '🏆'];

const loadAutoReactConfig = () => {
    try {
        if (!fs.existsSync(path.dirname(configFile))) {
            fs.mkdirSync(path.dirname(configFile), { recursive: true });
        }
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile, 'utf8'));
        }
    } catch (error) {
            console.error(`[Command Error] autoreact.js:`, error.message);}
    return {};
};

const saveAutoReactConfig = (config) => {
    try {
        fs.mkdirSync(path.dirname(configFile), { recursive: true });
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    } catch (error) {
            console.error(`[Command Error] autoreact.js:`, error.message);}
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
                        .setDescription('Emoji to react with')
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
                .setDescription('List all configured auto-reactions'))
        .addSubcommand(sub =>
            sub.setName('enable')
                .setDescription('Enable auto-reactions for this server'))
        .addSubcommand(sub =>
            sub.setName('disable')
                .setDescription('Disable auto-reactions for this server'))
        .addSubcommand(sub =>
            sub.setName('mention')
                .setDescription('Enable/disable random reactions on user mentions')
                .addStringOption(opt =>
                    opt.setName('action')
                        .setDescription('Enable or disable mention reactions')
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' }
                        )
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction) {
        try {
            const config = loadAutoReactConfig();
            const guildId = interaction.guild.id;
            const subcommand = interaction.options.getSubcommand();
            
            if (!config[guildId]) {
                config[guildId] = { keywords: {}, enabled: true, mentionReactionsEnabled: false };
            }

            if (subcommand === 'add') {
                const keyword = interaction.options.getString('keyword').toLowerCase();
                const reactionEmoji = interaction.options.getString('emoji');
                
                if (keyword.length < 2) {
                    const embed = AdvancedEmbed.warning('Invalid Keyword', 'Keyword must be at least 2 characters long');
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }
                
                config[guildId].keywords[keyword] = reactionEmoji;
                saveAutoReactConfig(config);
                
                const embed = AdvancedEmbed.commandSuccess('Auto-Reaction Added', `\`${keyword}\` → ${reactionEmoji}`);
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'remove') {
                const keyword = interaction.options.getString('keyword').toLowerCase();
                
                if (config[guildId].keywords[keyword]) {
                    delete config[guildId].keywords[keyword];
                    saveAutoReactConfig(config);
                    const embed = AdvancedEmbed.commandSuccess('Auto-Reaction Removed', `Removed reaction for \`${keyword}\``);
                    return interaction.reply({ embeds: [embed] });
                }
                
                const embed = AdvancedEmbed.warning('Not Found', `No auto-reaction found for \`${keyword}\``);
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            if (subcommand === 'list') {
                const reactions = Object.entries(config[guildId].keywords || {});
                
                if (reactions.length === 0) {
                    const embed = AdvancedEmbed.info('Auto-Reactions', 'No auto-reactions configured yet');
                    return interaction.reply({ embeds: [embed] });
                }
                
                const entries = reactions.map(([kw, em]) => `${em} \`${kw}\``);
                const embed = AdvancedEmbed.list('Auto-Reactions', entries, emoji.color_info);
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'enable') {
                config[guildId].enabled = true;
                saveAutoReactConfig(config);
                const embed = AdvancedEmbed.commandSuccess('Auto-Reactions Enabled', 'Bot will react to keywords');
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'disable') {
                config[guildId].enabled = false;
                saveAutoReactConfig(config);
                const embed = AdvancedEmbed.commandSuccess('Auto-Reactions Disabled', 'Bot will not react to keywords');
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'mention') {
                const action = interaction.options.getString('action');
                const enabled = action === 'enable';
                config[guildId].mentionReactionsEnabled = enabled;
                saveAutoReactConfig(config);
                const embed = AdvancedEmbed.commandSuccess(
                    'Mention Reactions',
                    enabled ? 'Bot will randomly react to mentions' : 'Bot will not react to mentions'
                );
                return interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(`[Command Error] autoreact.js:`, error.message);
            const embed = AdvancedEmbed.commandError('Auto-React Error', 'Could not process command');
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {});
            }
        }
    }
};
