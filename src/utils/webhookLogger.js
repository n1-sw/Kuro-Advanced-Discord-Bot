const { EmbedBuilder } = require('discord.js');

class WebhookLogger {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
        this.enabled = this.validateUrl(webhookUrl);
    }

    validateUrl(url) {
        if (!url) return false;
        try {
            return url.startsWith('https://discord.com/api/webhooks/1443891889760768083/qaEq_0BYNWpKs14mQBoGPD61yPfMsf8nma5WCNzSRJ2hQ_JtKLjNEMVI6yo-4kjlkt3Y');
        } catch {
            return false;
        }
    }

    async sendError(title, message, details = {}) {
        if (!this.enabled) return;

        try {
            const embed = new EmbedBuilder()
                .setTitle(`🚨 ${title}`)
                .setDescription(message || 'Unknown error')
                .setColor(0xFF0000)
                .setTimestamp()
                .addFields(
                    { name: 'Timestamp', value: new Date().toISOString(), inline: false },
                    { name: 'Environment', value: process.env.NODE_ENV || 'production', inline: true }
                );

            if (details.commandName) {
                embed.addFields({ name: 'Command', value: `/${details.commandName}`, inline: true });
            }
            if (details.userId) {
                embed.addFields({ name: 'User ID', value: details.userId, inline: true });
            }
            if (details.guildId) {
                embed.addFields({ name: 'Guild ID', value: details.guildId, inline: true });
            }
            if (details.errorCode) {
                embed.addFields({ name: 'Error Code', value: String(details.errorCode), inline: true });
            }
            if (details.stack) {
                const stackSliced = String(details.stack).substring(0, 1024);
                embed.addFields({ name: 'Stack Trace', value: `\`\`\`${stackSliced}\`\`\``, inline: false });
            }

            const payload = { embeds: [embed] };

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                timeout: 5000
            }).catch(e => {
                console.error('Webhook fetch error:', e.message);
                return null;
            });

            if (response && !response.ok) {
                console.error(`Webhook error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to send webhook error:', error?.message || error);
        }
    }

    async sendWarning(title, message, details = {}) {
        if (!this.enabled) return;

        try {
            const embed = new EmbedBuilder()
                .setTitle(`⚠️ ${title}`)
                .setDescription(message || 'Warning issued')
                .setColor(0xFFA500)
                .setTimestamp();

            if (details.info) {
                embed.addFields({ name: 'Info', value: String(details.info), inline: false });
            }

            const payload = { embeds: [embed] };

            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                timeout: 5000
            }).catch(() => {});
        } catch (error) {
            console.error('Failed to send webhook warning:', error?.message || error);
        }
    }

    async sendInfo(title, message, details = {}) {
        if (!this.enabled) return;

        try {
            const embed = new EmbedBuilder()
                .setTitle(`ℹ️ ${title}`)
                .setDescription(message || 'Information')
                .setColor(0x0099FF)
                .setTimestamp();

            if (details.info) {
                embed.addFields({ name: 'Details', value: String(details.info), inline: false });
            }

            const payload = { embeds: [embed] };

            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                timeout: 5000
            }).catch(() => {});
        } catch (error) {
            console.error('Failed to send webhook info:', error?.message || error);
        }
    }
}

module.exports = WebhookLogger;
