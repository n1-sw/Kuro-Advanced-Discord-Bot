/**
 * AutoModerationActionExecution Event Handler
 * Handles Discord's native AutoMod rule actions
 * PRODUCTION READY - Full error handling and logging
 */

const emoji = require('../utils/emoji');
const WebhookLogger = require('../utils/webhookLogger');

module.exports = {
    name: 'autoModerationActionExecution',
    async execute(action, client) {
        try {
            const { guild, user, action: actionData, rule } = action;

            // Validate required data
            if (!guild || !user || !actionData || !rule) {
                console.warn(`${emoji.warning} AutoMod: Incomplete action data received`);
                return;
            }

            console.log(`${emoji.shield} AutoMod Action Triggered`);
            console.log(`   Rule: ${rule.name}`);
            console.log(`   User: ${user.tag} (${user.id})`);
            console.log(`   Guild: ${guild.name}`);
            console.log(`   Action: ${actionData.type}`);

            // Log to webhook if available
            if (client.webhookLogger && client.webhookLogger.enabled) {
                try {
                    await client.webhookLogger.sendWarning(
                        `${emoji.shield} AutoMod Rule Triggered`,
                        `**Rule:** ${rule.name}\n**User:** ${user.tag}\n**Action:** ${actionData.type}`,
                        {
                            guild: guild.name,
                            guildId: guild.id,
                            userId: user.id,
                            ruleType: rule.triggerType,
                            actionType: actionData.type
                        }
                    );
                } catch (webhookError) {
                    console.error(`${emoji.error} Failed to log to webhook:`, webhookError.message);
                }
            }

            // Log specific action types
            switch (actionData.type) {
                case 'BLOCK_MESSAGE':
                    console.log(`   ${emoji.success} Message blocked by AutoMod`);
                    break;

                case 'SEND_ALERT_MESSAGE':
                    console.log(`   ${emoji.warning} Alert notification sent`);
                    break;

                case 'TIMEOUT':
                    console.log(`   ${emoji.clock} User timed out (${actionData.metadata?.durationSeconds || 300}s)`);
                    break;

                default:
                    console.log(`   Action executed: ${actionData.type}`);
            }

        } catch (error) {
            console.error(`${emoji.error} AutoModerationActionExecution handler error:`, {
                message: error.message,
                stack: error.stack
            });
        }
    }
};
