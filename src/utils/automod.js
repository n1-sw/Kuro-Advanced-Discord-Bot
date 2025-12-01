/**
 * Discord AutoMod Management Utility
 * Manages Discord's native AutoMod rules and configurations
 * PRODUCTION READY - Full error handling and validation
 */

const { AutoModerationRuleTriggerType, AutoModerationRuleActionType } = require('discord.js');
const emoji = require('./emoji');

class AutoModManager {
    constructor(client) {
        this.client = client;
    }

    validateGuild(guild) {
        if (!guild) {
            return { valid: false, error: 'Guild not found' };
        }

        const botMember = guild.members.me;
        if (!botMember) {
            return { valid: false, error: 'Bot not in guild' };
        }

        if (!botMember.permissions.has('ManageGuild')) {
            return { valid: false, error: 'Bot lacks Manage Guild permission' };
        }

        return { valid: true };
    }

    async createKeywordRule(guild, name, keywords, actionType = 'BLOCK_MESSAGE') {
        try {
            const validation = this.validateGuild(guild);
            if (!validation.valid) {
                console.error(`${emoji.error} AutoMod validation error: ${validation.error}`);
                return null;
            }

            if (!name || typeof name !== 'string') {
                console.error(`${emoji.error} AutoMod error: Invalid rule name`);
                return null;
            }

            if (!Array.isArray(keywords) || keywords.length === 0) {
                console.error(`${emoji.error} AutoMod error: Keywords must be non-empty array`);
                return null;
            }

            const limitedKeywords = keywords.slice(0, 100);
            if (limitedKeywords.length < keywords.length) {
                console.warn(`${emoji.warning} AutoMod: Truncated keywords to 100 (provided ${keywords.length})`);
            }

            const validActions = ['BLOCK_MESSAGE', 'TIMEOUT', 'SEND_ALERT_MESSAGE'];
            if (!validActions.includes(actionType)) {
                console.error(`${emoji.error} AutoMod error: Invalid action type: ${actionType}`);
                return null;
            }

            const actionObj = {
                type: actionType
            };

            if (actionType === 'TIMEOUT') {
                actionObj.metadata = {
                    durationSeconds: 300
                };
            }

            const rule = await guild.autoModerationRules.create({
                name: name.substring(0, 100),
                eventType: 'MESSAGE_SEND',
                triggerType: AutoModerationRuleTriggerType.Keyword,
                triggerMetadata: {
                    keywordFilter: limitedKeywords
                },
                actions: [actionObj],
                enabled: true,
                exemptRoles: [],
                exemptChannels: []
            });

            console.log(`${emoji.success} AutoMod keyword rule created: ${rule.name} (ID: ${rule.id})`);
            return rule;
        } catch (error) {
            console.error(`${emoji.error} Error creating AutoMod keyword rule:`, {
                message: error.message,
                code: error.code
            });
            return null;
        }
    }

    async createSpamRule(guild, name = 'Spam Detection') {
        try {
            const validation = this.validateGuild(guild);
            if (!validation.valid) {
                console.error(`${emoji.error} AutoMod validation error: ${validation.error}`);
                return null;
            }

            const rule = await guild.autoModerationRules.create({
                name: name.substring(0, 100),
                eventType: 'MESSAGE_SEND',
                triggerType: AutoModerationRuleTriggerType.Spam,
                actions: [{
                    type: 'BLOCK_MESSAGE'
                }],
                enabled: true,
                exemptRoles: [],
                exemptChannels: []
            });

            console.log(`${emoji.success} AutoMod spam rule created: ${rule.name} (ID: ${rule.id})`);
            return rule;
        } catch (error) {
            console.error(`${emoji.error} Error creating AutoMod spam rule:`, {
                message: error.message,
                code: error.code
            });
            return null;
        }
    }

    async getRules(guild) {
        try {
            const validation = this.validateGuild(guild);
            if (!validation.valid) {
                console.error(`${emoji.error} AutoMod validation error: ${validation.error}`);
                return null;
            }

            const rules = await guild.autoModerationRules.fetch();
            console.log(`${emoji.success} Fetched ${rules.size} AutoMod rules from ${guild.name}`);
            return rules;
        } catch (error) {
            console.error(`${emoji.error} Error fetching AutoMod rules:`, {
                message: error.message,
                code: error.code
            });
            return null;
        }
    }

    async deleteRule(guild, ruleId) {
        try {
            const validation = this.validateGuild(guild);
            if (!validation.valid) {
                console.error(`${emoji.error} AutoMod validation error: ${validation.error}`);
                return false;
            }

            if (!ruleId || typeof ruleId !== 'string') {
                console.error(`${emoji.error} AutoMod error: Invalid rule ID`);
                return false;
            }

            const rule = await guild.autoModerationRules.fetch(ruleId);
            if (!rule) {
                console.error(`${emoji.error} AutoMod error: Rule not found`);
                return false;
            }

            await rule.delete('AutoMod management');
            console.log(`${emoji.success} AutoMod rule deleted: ${rule.name} (ID: ${ruleId})`);
            return true;
        } catch (error) {
            console.error(`${emoji.error} Error deleting AutoMod rule:`, {
                message: error.message,
                code: error.code,
                ruleId
            });
            return false;
        }
    }

    async updateRule(guild, ruleId, updates) {
        try {
            const validation = this.validateGuild(guild);
            if (!validation.valid) {
                console.error(`${emoji.error} AutoMod validation error: ${validation.error}`);
                return null;
            }

            if (!ruleId || typeof ruleId !== 'string') {
                console.error(`${emoji.error} AutoMod error: Invalid rule ID`);
                return null;
            }

            if (!updates || typeof updates !== 'object') {
                console.error(`${emoji.error} AutoMod error: Invalid updates object`);
                return null;
            }

            const rule = await guild.autoModerationRules.fetch(ruleId);
            if (!rule) {
                console.error(`${emoji.error} AutoMod error: Rule not found`);
                return false;
            }

            const updated = await rule.edit(updates);
            console.log(`${emoji.success} AutoMod rule updated: ${updated.name} (ID: ${ruleId})`);
            return updated;
        } catch (error) {
            console.error(`${emoji.error} Error updating AutoMod rule:`, {
                message: error.message,
                code: error.code,
                ruleId
            });
            return null;
        }
    }

    async setRuleEnabled(guild, ruleId, enabled) {
        if (typeof enabled !== 'boolean') {
            console.error(`${emoji.error} AutoMod error: enabled must be boolean`);
            return null;
        }

        return this.updateRule(guild, ruleId, { enabled });
    }

    formatRuleInfo(rule) {
        if (!rule) {
            return 'Invalid rule data';
        }

        const triggerType = rule.triggerType || 'Unknown';
        const enabled = rule.enabled ? `${emoji.success} Enabled` : `${emoji.error} Disabled`;
        const actions = rule.actions && rule.actions.length > 0 
            ? rule.actions.map(a => a.type).join(', ')
            : 'No actions';

        return `**${rule.name}**\n` +
               `${emoji.gear} Type: ${triggerType}\n` +
               `${emoji.status} Status: ${enabled}\n` +
               `${emoji.zap} Actions: ${actions}\n` +
               `${emoji.id} ID: \`${rule.id}\``;
    }

    formatRulesList(rules) {
        if (!rules || rules.size === 0) {
            return 'No AutoMod rules found';
        }

        return rules
            .map((rule, index) => `**${index + 1}. ${rule.name}**\n${emoji.id}: \`${rule.id}\``)
            .join('\n\n');
    }
}

module.exports = AutoModManager;
