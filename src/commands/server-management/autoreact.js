const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');
const { guildSettings } = require('../../utils/database');

const defaultEmojis = ['😀', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯', '🙌', '👀', '💪', '🤩', '😎', '🥳', '💖', '⭐', '🌟', '💫', '🎯', '🏆'];

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
            const guildId = interaction.guild.id;
            const subcommand = interaction.options.getSubcommand();
            
            let settings = await guildSettings.get(guildId);
            
            if (!settings.autoReactKeywords) {
                settings.autoReactKeywords = {};
            }

            if (subcommand === 'add') {
                const keyword = interaction.options.getString('keyword').toLowerCase();
                const reactionEmoji = interaction.options.getString('emoji');
                
                if (keyword.length < 2) {
                    const embed = AdvancedEmbed.warning('Invalid Keyword', 'Keyword must be at least 2 characters long');
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }
                
                const keywords = { ...settings.autoReactKeywords };
                keywords[keyword] = reactionEmoji;
                
                await guildSettings.update(guildId, { autoReactKeywords: keywords });
                
                const embed = AdvancedEmbed.commandSuccess('Auto-Reaction Added', `\`${keyword}\` → ${reactionEmoji}`);
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'remove') {
                const keyword = interaction.options.getString('keyword').toLowerCase();
                
                const keywords = { ...settings.autoReactKeywords };
                if (keywords[keyword]) {
                    delete keywords[keyword];
                    await guildSettings.update(guildId, { autoReactKeywords: keywords });
                    
                    const embed = AdvancedEmbed.commandSuccess('Auto-Reaction Removed', `Removed reaction for \`${keyword}\``);
                    return interaction.reply({ embeds: [embed] });
                }
                
                const embed = AdvancedEmbed.warning('Not Found', `No auto-reaction found for \`${keyword}\``);
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            if (subcommand === 'list') {
                const keywords = settings.autoReactKeywords || {};
                const reactions = Object.entries(keywords);
                
                if (reactions.length === 0) {
                    const embed = AdvancedEmbed.info('Auto-Reactions', 'No auto-reactions configured yet.\n\nUse `/autoreact add` to add keywords!');
                    return interaction.reply({ embeds: [embed] });
                }
                
                const entries = reactions.map(([kw, em]) => `${em} \`${kw}\``);
                const embed = AdvancedEmbed.list('Auto-Reactions', entries, emoji.color_info);
                embed.addFields({ 
                    name: `${emoji.status} Status`, 
                    value: settings.autoReactEnabled ? `${emoji.success} Enabled` : `${emoji.error} Disabled`,
                    inline: true 
                });
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'enable') {
                await guildSettings.update(guildId, { autoReactEnabled: true });
                const embed = AdvancedEmbed.commandSuccess('Auto-Reactions Enabled', 'Bot will now react to configured keywords');
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'disable') {
                await guildSettings.update(guildId, { autoReactEnabled: false });
                const embed = AdvancedEmbed.commandSuccess('Auto-Reactions Disabled', 'Bot will no longer react to keywords');
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'mention') {
                const action = interaction.options.getString('action');
                const enabled = action === 'enable';
                await guildSettings.update(guildId, { mentionReactionsEnabled: enabled });
                
                const embed = AdvancedEmbed.commandSuccess(
                    'Mention Reactions',
                    enabled ? 'Bot will randomly react when users are mentioned' : 'Bot will not react to mentions'
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
    },
    
    async handleMessage(message, client) {
        if (message.author.bot || !message.guild) return;
        
        try {
            const settings = await guildSettings.get(message.guild.id);
            
            if (!settings.autoReactEnabled) return;
            
            const content = message.content.toLowerCase();
            const keywords = settings.autoReactKeywords || {};
            
            for (const [keyword, reactionEmoji] of Object.entries(keywords)) {
                if (content.includes(keyword)) {
                    try {
                        await message.react(reactionEmoji);
                    } catch (e) {
                    }
                }
            }
            
            if (settings.mentionReactionsEnabled && message.mentions.users.size > 0) {
                const randomEmoji = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
                try {
                    await message.react(randomEmoji);
                } catch (e) {
                }
            }
        } catch (error) {
            console.error('AutoReact handler error:', error.message);
        }
    }
};
