const { EmbedBuilder } = require('discord.js');
const emoji = require('./emoji');

class AdvancedEmbedBuilder {
    // Command Success Embed
    static commandSuccess(title, description, fields = []) {
        return new EmbedBuilder()
            .setTitle(`${emoji.success} ${title}`)
            .setDescription(description)
            .setColor(emoji.color_success)
            .addFields(...fields)
            .setFooter({ text: '✅ Command executed successfully' })
            .setTimestamp();
    }

    // Command Error Embed
    static commandError(title, description, details = '') {
        const embed = new EmbedBuilder()
            .setTitle(`${emoji.error} ${title}`)
            .setDescription(description)
            .setColor(emoji.color_error)
            .setFooter({ text: '❌ Operation failed' })
            .setTimestamp();
        
        if (details) {
            embed.addFields({ name: `${emoji.document} Details`, value: details, inline: false });
        }
        
        return embed;
    }

    // Info Embed with icon
    static info(title, description, fields = []) {
        return new EmbedBuilder()
            .setTitle(`${emoji.info} ${title}`)
            .setDescription(description)
            .setColor(emoji.color_info)
            .addFields(...fields)
            .setFooter({ text: 'ℹ️ Information' })
            .setTimestamp();
    }

    // User Profile Embed
    static userProfile(user, title, fields = []) {
        return new EmbedBuilder()
            .setAuthor({ name: `${title}`, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setColor(emoji.color_info)
            .addFields(...fields)
            .setFooter({ text: `ID: ${user.id}` })
            .setTimestamp();
    }

    // Progress Bar Embed
    static progressBar(title, current, max, label, fields = []) {
        const percent = Math.floor((current / max) * 100);
        const filled = Math.floor(percent / 10);
        const empty = 10 - filled;
        const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
        
        return new EmbedBuilder()
            .setTitle(`${emoji.chart} ${title}`)
            .setDescription(`\`\`\`${bar}\`\`\`\n**${label}:** \`${current} / ${max}\` (\`${percent}%\`)`)
            .setColor(percent > 75 ? emoji.color_success : percent > 50 ? emoji.color_warning : emoji.color_error)
            .addFields(...fields)
            .setFooter({ text: `Progress: ${percent}%` })
            .setTimestamp();
    }

    // Stat Display Embed
    static stats(title, stats = {}, color = null) {
        const fields = Object.entries(stats).map(([key, value]) => ({
            name: key,
            value: `\`${value}\``,
            inline: true
        }));

        return new EmbedBuilder()
            .setTitle(`${emoji.chart} ${title}`)
            .setColor(color || emoji.color_info)
            .addFields(...fields)
            .setFooter({ text: '📊 Statistics' })
            .setTimestamp();
    }

    // Leaderboard Embed
    static leaderboard(title, entries = [], color = null) {
        const description = entries
            .slice(0, 10)
            .map((entry, i) => `\`${i + 1}.\` ${entry}`)
            .join('\n') || 'No entries';

        return new EmbedBuilder()
            .setTitle(`${emoji.trophy} ${title}`)
            .setDescription(description)
            .setColor(color || emoji.color_success)
            .setFooter({ text: '🏆 Leaderboard' })
            .setTimestamp();
    }

    // List Embed
    static list(title, items = [], color = null) {
        const description = items
            .map((item, i) => `\`${i + 1}.\` ${item}`)
            .join('\n') || 'Empty list';

        return new EmbedBuilder()
            .setTitle(`${emoji.list} ${title}`)
            .setDescription(description)
            .setColor(color || emoji.color_info)
            .setFooter({ text: '📋 List' })
            .setTimestamp();
    }

    // Warning Embed
    static warning(title, message, fields = []) {
        return new EmbedBuilder()
            .setTitle(`${emoji.warning} ${title}`)
            .setDescription(message)
            .setColor(emoji.color_warning)
            .addFields(...fields)
            .setFooter({ text: '⚠️ Warning' })
            .setTimestamp();
    }

    // Alert/Critical Embed
    static alert(title, message, fields = []) {
        return new EmbedBuilder()
            .setTitle(`${emoji.alert} ${title}`)
            .setDescription(message)
            .setColor(emoji.color_error)
            .addFields(...fields)
            .setFooter({ text: '🚨 Alert' })
            .setTimestamp();
    }

    // Game Embed
    static game(title, description, fields = [], thumbnail = null) {
        const embed = new EmbedBuilder()
            .setTitle(`${emoji.games} ${title}`)
            .setDescription(description)
            .setColor(emoji.color_economy)
            .addFields(...fields)
            .setFooter({ text: '🎮 Game' })
            .setTimestamp();
        
        if (thumbnail) embed.setThumbnail(thumbnail);
        return embed;
    }

    // Economy Embed
    static economy(title, description, fields = [], thumbnail = null) {
        const embed = new EmbedBuilder()
            .setTitle(`${emoji.diamond} ${title}`)
            .setDescription(description)
            .setColor(emoji.color_economy)
            .addFields(...fields)
            .setFooter({ text: '💰 Economy' })
            .setTimestamp();
        
        if (thumbnail) embed.setThumbnail(thumbnail);
        return embed;
    }

    // Leveling Embed
    static leveling(title, description, fields = [], badge = '') {
        return new EmbedBuilder()
            .setTitle(`${badge || emoji.leveling} ${title}`)
            .setDescription(description)
            .setColor(emoji.color_info)
            .addFields(...fields)
            .setFooter({ text: '📈 Leveling System' })
            .setTimestamp();
    }

    // Moderation Embed
    static moderation(title, description, fields = []) {
        return new EmbedBuilder()
            .setTitle(`${emoji.shield} ${title}`)
            .setDescription(description)
            .setColor(emoji.color_warning)
            .addFields(...fields)
            .setFooter({ text: '🛡️ Moderation' })
            .setTimestamp();
    }

    // Server Info Embed
    static serverInfo(title, description, fields = [], icon = null) {
        const embed = new EmbedBuilder()
            .setTitle(`${emoji.server} ${title}`)
            .setDescription(description)
            .setColor(emoji.color_info)
            .addFields(...fields)
            .setFooter({ text: '🖥️ Server Information' })
            .setTimestamp();
        
        if (icon) embed.setThumbnail(icon);
        return embed;
    }

    // Compact Status Embed (for quick responses)
    static status(title, status, details = {}) {
        const statusIcon = status === 'success' ? emoji.success : status === 'error' ? emoji.error : emoji.warning;
        const color = status === 'success' ? emoji.color_success : status === 'error' ? emoji.color_error : emoji.color_warning;
        
        const fields = Object.entries(details).map(([key, value]) => ({
            name: key,
            value: `\`${value}\``,
            inline: true
        }));

        return new EmbedBuilder()
            .setTitle(`${statusIcon} ${title}`)
            .setColor(color)
            .addFields(...fields)
            .setTimestamp();
    }
}

module.exports = AdvancedEmbedBuilder;
