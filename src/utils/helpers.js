const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const createEmbed = (options = {}) => {
    const embed = new EmbedBuilder();
    
    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.color) embed.setColor(options.color);
    if (options.fields) embed.addFields(options.fields);
    if (options.footer) embed.setFooter({ text: options.footer });
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.timestamp) embed.setTimestamp();
    
    return embed;
};

const successEmbed = (description) => {
    return createEmbed({
        description: `✅ ${description}`,
        color: 0x00ff00
    });
};

const errorEmbed = (description) => {
    return createEmbed({
        description: `❌ ${description}`,
        color: 0xff0000
    });
};

const infoEmbed = (title, description) => {
    return createEmbed({
        title,
        description,
        color: 0x0099ff,
        timestamp: true
    });
};

const calculateXpForLevel = (level) => {
    return Math.floor(100 * Math.pow(1.5, level));
};

const calculateLevel = (xp) => {
    let level = 0;
    let totalXp = 0;
    
    while (totalXp + calculateXpForLevel(level) <= xp) {
        totalXp += calculateXpForLevel(level);
        level++;
    }
    
    return level;
};

const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

const hasPermission = (member, permission) => {
    return member.permissions.has(permission);
};

const isAdmin = (member) => {
    return hasPermission(member, PermissionFlagsBits.Administrator);
};

const isModerator = (member) => {
    return hasPermission(member, PermissionFlagsBits.ModerateMembers) || 
           hasPermission(member, PermissionFlagsBits.KickMembers) ||
           hasPermission(member, PermissionFlagsBits.BanMembers);
};

const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const parseTime = (timeStr) => {
    const regex = /^(\d+)(s|m|h|d)$/;
    const match = timeStr.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
};

const progressBar = (current, max, length = 10) => {
    const percentage = current / max;
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    
    return '█'.repeat(filled) + '░'.repeat(empty);
};

module.exports = {
    createEmbed,
    successEmbed,
    errorEmbed,
    infoEmbed,
    calculateXpForLevel,
    calculateLevel,
    formatNumber,
    formatDuration,
    hasPermission,
    isAdmin,
    isModerator,
    randomInt,
    parseTime,
    progressBar
};
