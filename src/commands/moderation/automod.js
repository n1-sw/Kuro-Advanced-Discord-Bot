/**
 * AutoMod Management Command
 * Manage Discord's native AutoMod rules
 * PRODUCTION READY - Full error handling, validation, and user feedback
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/helpers');
const emoji = require('../../utils/emoji');
const AutoModManager = require('../../utils/automod');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Manage Discord AutoMod rules')
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription(`${emoji.list} List all AutoMod rules in this server`))
        .addSubcommand(sub =>
            sub.setName('addbadwords')
                .setDescription(`${emoji.blocked} Create keyword filter rule`)
                .addStringOption(opt =>
                    opt.setName('keywords')
                        .setDescription('Comma-separated keywords to block (e.g. word1,word2,word3)')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('action')
                        .setDescription('Action when rule triggers')
                        .setChoices(
                            { name: `${emoji.error} Block Message (delete)`, value: 'BLOCK_MESSAGE' },
                            { name: `${emoji.timer} Timeout User (5 min)`, value: 'TIMEOUT' },
                            { name: `${emoji.bell} Send Alert`, value: 'SEND_ALERT_MESSAGE' }
                        )
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('addspam')
                .setDescription(`${emoji.search} Create spam detection rule`))
        .addSubcommand(sub =>
            sub.setName('delete')
                .setDescription(`${emoji.delete} Delete AutoMod rule`)
                .addStringOption(opt =>
                    opt.setName('ruleid')
                        .setDescription('Rule ID to delete (get from /automod list)')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('toggle')
                .setDescription(`${emoji.zap} Enable or disable AutoMod rule`)
                .addStringOption(opt =>
                    opt.setName('ruleid')
                        .setDescription('Rule ID to toggle')
                        .setRequired(true))
                .addBooleanOption(opt =>
                    opt.setName('enabled')
                        .setDescription('Enable (true) or disable (false)')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.editReply({
                    embeds: [errorEmbed(`${emoji.error} You need "Manage Guild" permission to use this command.`)]
                });
            }

            const subcommand = interaction.options.getSubcommand();
            const autoModManager = new AutoModManager(interaction.client);

            const guildValidation = autoModManager.validateGuild(interaction.guild);
            if (!guildValidation.valid) {
                return interaction.editReply({
                    embeds: [errorEmbed(`${emoji.error} ${guildValidation.error}`)]
                });
            }

            switch (subcommand) {
                case 'list':
                    await handleListRules(interaction, autoModManager);
                    break;
                case 'addbadwords':
                    await handleAddBadwords(interaction, autoModManager);
                    break;
                case 'addspam':
                    await handleAddSpam(interaction, autoModManager);
                    break;
                case 'delete':
                    await handleDeleteRule(interaction, autoModManager);
                    break;
                case 'toggle':
                    await handleToggleRule(interaction, autoModManager);
                    break;
                default:
                    await interaction.editReply({
                        embeds: [errorEmbed(`${emoji.error} Unknown subcommand`)]
                    });
            }
        } catch (error) {
            console.error(`${emoji.error} AutoMod command error:`, error);
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        embeds: [errorEmbed(`${emoji.error} An error occurred while processing your request.`)],
                        ephemeral: true
                    });
                } catch (e) {
                    console.error('Failed to send error reply:', e);
                }
            } else if (interaction.deferred) {
                try {
                    await interaction.editReply({
                        embeds: [errorEmbed(`${emoji.error} An error occurred while processing your request.`)]
                    });
                } catch (e) {
                    console.error('Failed to edit error reply:', e);
                }
            }
        }
    }
};

async function handleListRules(interaction, autoModManager) {
    try {
        const rules = await autoModManager.getRules(interaction.guild);

        if (!rules || rules.size === 0) {
            return interaction.editReply({
                embeds: [createEmbed({
                    title: `${emoji.info} No AutoMod Rules`,
                    description: 'This server has no AutoMod rules yet. Use `/automod addbadwords` or `/automod addspam` to create one.',
                    color: 0xFFA500
                })]
            });
        }

        const rulesText = rules
            .map((rule, i) => autoModManager.formatRuleInfo(rule))
            .join('\n\n---\n\n');

        const embed = createEmbed({
            title: `${emoji.shield} AutoMod Rules (${rules.size} total)`,
            description: rulesText,
            color: 0x00FF00,
            footer: 'Copy rule ID to manage it with /automod delete or /automod toggle'
        });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error(`${emoji.error} Error listing rules:`, error);
        await interaction.editReply({
            embeds: [errorEmbed(`${emoji.error} Failed to list AutoMod rules. Please try again later.`)]
        });
    }
}

async function handleAddBadwords(interaction, autoModManager) {
    try {
        const keywordsInput = interaction.options.getString('keywords');
        const action = interaction.options.getString('action') || 'BLOCK_MESSAGE';

        const keywords = keywordsInput
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0 && k.length <= 30);

        if (keywords.length === 0) {
            return interaction.editReply({
                embeds: [errorEmbed(`${emoji.error} No valid keywords provided. Please provide comma-separated keywords.`)]
            });
        }

        if (keywords.length > 100) {
            return interaction.editReply({
                embeds: [errorEmbed(`${emoji.error} Too many keywords. Maximum is 100 keywords per rule.`)]
            });
        }

        const ruleName = `Keyword Filter - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

        const rule = await autoModManager.createKeywordRule(
            interaction.guild,
            ruleName,
            keywords,
            action
        );

        if (!rule) {
            return interaction.editReply({
                embeds: [errorEmbed(`${emoji.error} Failed to create AutoMod rule. Ensure the bot has "Manage Guild" permission.`)]
            });
        }

        const embed = createEmbed({
            title: `${emoji.success} AutoMod Keyword Filter Created`,
            description: `**Rule Name:** ${rule.name}\n**Keywords Blocked:** ${keywords.length}\n**Action:** ${action}`,
            color: 0x00FF00,
            fields: [
                {
                    name: `${emoji.keys} Keywords`,
                    value: `\`${keywords.join(', ')}\``,
                    inline: false
                },
                {
                    name: `${emoji.zap} Action Type`,
                    value: action === 'BLOCK_MESSAGE' ? `${emoji.error} Block & Delete`
                        : action === 'TIMEOUT' ? `${emoji.timer} Timeout (5 min)`
                        : `${emoji.bell} Send Alert`,
                    inline: true
                },
                {
                    name: `${emoji.id} Rule ID`,
                    value: `\`${rule.id}\``,
                    inline: true
                },
                {
                    name: `${emoji.status} Status`,
                    value: rule.enabled ? `${emoji.success} Active` : `${emoji.error} Inactive`,
                    inline: true
                }
            ],
            footer: 'Use /automod toggle to enable/disable this rule'
        });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error(`${emoji.error} Error adding badwords rule:`, error);
        await interaction.editReply({
            embeds: [errorEmbed(`${emoji.error} Failed to create keyword filter rule. Please try again.`)]
        });
    }
}

async function handleAddSpam(interaction, autoModManager) {
    try {
        const ruleName = `Spam Detection - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

        const rule = await autoModManager.createSpamRule(interaction.guild, ruleName);

        if (!rule) {
            return interaction.editReply({
                embeds: [errorEmbed(`${emoji.error} Failed to create spam detection rule. Ensure the bot has "Manage Guild" permission.`)]
            });
        }

        const embed = createEmbed({
            title: `${emoji.success} AutoMod Spam Detection Created`,
            description: `**Rule Name:** ${rule.name}`,
            color: 0x00FF00,
            fields: [
                {
                    name: `${emoji.search} Detection Types`,
                    value: '• Message flooding\n• Mass mentions\n• Raid patterns',
                    inline: false
                },
                {
                    name: `${emoji.zap} Action`,
                    value: `${emoji.error} Block & Delete`,
                    inline: true
                },
                {
                    name: `${emoji.id} Rule ID`,
                    value: `\`${rule.id}\``,
                    inline: true
                },
                {
                    name: `${emoji.status} Status`,
                    value: rule.enabled ? `${emoji.success} Active` : `${emoji.error} Inactive`,
                    inline: true
                }
            ],
            footer: 'Spam detection is now active for this server'
        });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error(`${emoji.error} Error adding spam rule:`, error);
        await interaction.editReply({
            embeds: [errorEmbed(`${emoji.error} Failed to create spam detection rule. Please try again.`)]
        });
    }
}

async function handleDeleteRule(interaction, autoModManager) {
    try {
        const ruleId = interaction.options.getString('ruleid').trim();

        if (!ruleId || ruleId.length < 10) {
            return interaction.editReply({
                embeds: [errorEmbed(`${emoji.error} Invalid rule ID format. Get the rule ID from \`/automod list\``)]
            });
        }

        const success = await autoModManager.deleteRule(interaction.guild, ruleId);

        if (!success) {
            return interaction.editReply({
                embeds: [errorEmbed(`${emoji.error} Failed to delete rule. The rule ID may be invalid or already deleted.`)]
            });
        }

        await interaction.editReply({
            embeds: [successEmbed(`${emoji.success} AutoMod rule deleted successfully.`)]
        });
    } catch (error) {
        console.error(`${emoji.error} Error deleting rule:`, error);
        await interaction.editReply({
            embeds: [errorEmbed(`${emoji.error} Failed to delete AutoMod rule. Please try again.`)]
        });
    }
}

async function handleToggleRule(interaction, autoModManager) {
    try {
        const ruleId = interaction.options.getString('ruleid').trim();
        const enabled = interaction.options.getBoolean('enabled');

        if (!ruleId || ruleId.length < 10) {
            return interaction.editReply({
                embeds: [errorEmbed(`${emoji.error} Invalid rule ID format. Get the rule ID from \`/automod list\``)]
            });
        }

        const rule = await autoModManager.setRuleEnabled(interaction.guild, ruleId, enabled);

        if (!rule) {
            return interaction.editReply({
                embeds: [errorEmbed(`${emoji.error} Failed to toggle rule. The rule ID may be invalid.`)]
            });
        }

        const status = enabled ? `${emoji.success} Enabled` : `${emoji.error} Disabled`;
        await interaction.editReply({
            embeds: [successEmbed(`${emoji.success} AutoMod Rule ${status}\n\n**Rule:** ${rule.name}`)]
        });
    } catch (error) {
        console.error(`${emoji.error} Error toggling rule:`, error);
        await interaction.editReply({
            embeds: [errorEmbed(`${emoji.error} Failed to toggle AutoMod rule. Please try again.`)]
        });
    }
}
