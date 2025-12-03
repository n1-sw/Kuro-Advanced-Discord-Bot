const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { guildSettings } = require('../../utils/database');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rankconfig')
        .setDescription('Configure ranking system for this guild')
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('View ranking system status'))
        .addSubcommand(sub =>
            sub.setName('toggle')
                .setDescription('Enable or disable the ranking system')
                .addBooleanOption(opt =>
                    opt.setName('enabled')
                        .setDescription('Enable (true) or disable (false)')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('xprate')
                .setDescription('Set XP gain rate multiplier (0.1x to 10x)')
                .addNumberOption(opt =>
                    opt.setName('multiplier')
                        .setDescription('XP multiplier (0.5 = half XP, 2 = double XP)')
                        .setMinValue(0.1)
                        .setMaxValue(10)
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            if (!interaction.member?.permissions.has(PermissionFlagsBits.Administrator)) {
                const embed = AdvancedEmbed.commandError('Permission Denied', 'You need Administrator permission');
                return interaction.reply({ embeds: [embed], flags: 64 }).catch(err => {
                    interaction.reply({ content: '❌ Permission denied', flags: 64 });
                });
            }

            const subcommand = interaction.options.getSubcommand() || 'status';
            const settings = guildSettings?.get?.(interaction.guild.id) || { rankingEnabled: true, xpMultiplier: 1 };

            if (subcommand === 'status') {
                const embed = AdvancedEmbed.stats?.(`🎯 Ranking System Configuration`, {
                    'Status': settings.rankingEnabled ? '✅ Enabled' : '❌ Disabled',
                    'XP Multiplier': `${(settings.xpMultiplier || 1).toFixed(2)}x`,
                    'Announcements': settings.announceLevel ? '✅ Enabled' : '❌ Disabled',
                    'Announcement Channel': settings.levelUpChannelId ? `<#${settings.levelUpChannelId}>` : 'Not set'
                }, emoji.color_info || 0x5865F2) || new (require('discord.js').EmbedBuilder)().setTitle('Ranking System').setDescription('Status: Enabled');
                return interaction.reply({ embeds: [embed] }).catch(err => {
                    interaction.reply({ content: `📊 Ranking System: ${settings.rankingEnabled ? 'Enabled' : 'Disabled'} | Multiplier: ${settings.xpMultiplier}x` });
                });
            }

            if (subcommand === 'toggle') {
                const enabled = interaction.options.getBoolean('enabled');
                guildSettings?.update?.(interaction.guild.id, { rankingEnabled: enabled });
                const embed = AdvancedEmbed.commandSuccess?.('Ranking System', `${enabled ? '✅ Enabled' : '❌ Disabled'} for this server`) || new (require('discord.js').EmbedBuilder)().setTitle('Updated').setDescription(`Ranking ${enabled ? 'enabled' : 'disabled'}`);
                return interaction.reply({ embeds: [embed] }).catch(err => {
                    interaction.reply({ content: `✅ Ranking system ${enabled ? 'enabled' : 'disabled'}` });
                });
            }

            if (subcommand === 'xprate') {
                const multiplier = interaction.options.getNumber('multiplier') || 1;
                guildSettings?.update?.(interaction.guild.id, { xpMultiplier: multiplier });
                const embed = AdvancedEmbed.commandSuccess?.('XP Multiplier Updated', `New multiplier: \`${multiplier}x\``) || new (require('discord.js').EmbedBuilder)().setTitle('Updated').setDescription(`XP: ${multiplier}x`);
                return interaction.reply({ embeds: [embed] }).catch(err => {
                    interaction.reply({ content: `✅ XP multiplier set to ${multiplier}x` });
                });
            }
        } catch (error) {
            console.error('[rankconfig.js]', error.message);
            const embed = AdvancedEmbed.commandError?.('Configuration Error', error.message || 'Could not update settings') || new (require('discord.js').EmbedBuilder)().setTitle('Error').setDescription('Failed to update settings');
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {
                    interaction.reply({ content: '❌ Configuration update failed', flags: 64 });
                });
            }
        }
    }
};
