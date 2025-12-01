/**
 * Centralized Emoji Management System
 * ALL emojis must be defined here - DO NOT hardcode emojis in commands/events
 * Import: const emoji = require('./emoji');
 * Usage: emoji.success, emoji.error, emoji.warning, etc.
 */

module.exports = {
    // ===== STATUS EMOJIS =====
    success: '✅',
    error: '❌',
    warning: '⚠️',
    pending: '⏳',
    info: 'ℹ️',
    
    // ===== SYSTEM EMOJIS =====
    bot: '🤖',
    lock: '🔐',
    unlock: '🔓',
    rocket: '🚀',
    sparkles: '✨',
    bell: '🔔',
    gear: '🔧',
    search: '🔍',
    refresh: '🔄',
    
    // ===== ACTION EMOJIS =====
    blocked: '🚫',
    trash: '🗑️',
    delete: '🗑️',
    cancel: '❌',
    confirm: '✅',
    yes: '✅',
    no: '❌',
    
    // ===== COMMAND CATEGORIES =====
    moderation: '🛡️',
    leveling: '📊',
    economy: '💰',
    mail: '📬',
    games: '🎮',
    botdev: '🔧',
    admin: '👑',
    
    // ===== FEATURES =====
    shield: '🛡️',
    coin: '💰',
    diamond: '💎',
    gift: '🎁',
    star: '⭐',
    target: '🎯',
    list: '📋',
    document: '📄',
    note: '📝',
    calendar: '📅',
    
    // ===== IDENTIFICATION =====
    id: '🆔',
    keys: '🔑',
    
    // ===== POWER/INTENSITY =====
    zap: '⚡',
    fire: '🔥',
    
    // ===== TIME =====
    clock: '⏰',
    timer: '⏱️',
    hourglass: '⏳',
    pause: '⏸️',
    
    // ===== GAME EMOJIS =====
    dice: '🎲',
    cards: '🃏',
    
    // ===== USER EMOJIS =====
    person: '👤',
    people: '👥',
    owner: '👑',
    developer: '👨‍💻',
    
    // ===== MEDALS =====
    gold_medal: '🥇',
    silver_medal: '🥈',
    bronze_medal: '🥉',
    
    // ===== GENERAL =====
    heart: '❤️',
    announcement: '📢',
    party: '🎉',
    credit_card: '💳',
    server: '🖥️',
    world: '🌍',
    
    // ===== AUTOMOD SPECIFIC =====
    automod: '🛡️',
    rule: '📋',
    keyword: '🔑',
    action: '⚡',
    status: '📊',
    
    // ===== TEXT FORMATTING =====
    pipe: '│',
    arrow_right: '→',
    arrow_left: '←',
    
    // ===== SETTINGS =====
    settings: '⚙️',
    
    // ===== INFO =====
    book: '📚',
    bulb: '💡',
    links: '🔗',
    members: '📌',
    mail: '📬',
    
    /**
     * Get emoji for a category
     * @param {string} category - The command category
     * @returns {string} The emoji for that category
     */
    getCategory(category) {
        const categoryMap = {
            'moderation': this.moderation,
            'leveling': this.leveling,
            'economy': this.economy,
            'mail': this.mail,
            'games': this.games,
            'bot-dev': this.botdev
        };
        return categoryMap[category] || '•';
    },
    
    /**
     * Get all category emojis for help commands
     * @returns {Object} Map of categories to emojis
     */
    getAllCategories() {
        return {
            'moderation': this.moderation,
            'leveling': this.leveling,
            'economy': this.economy,
            'mail': this.mail,
            'games': this.games,
            'bot-dev': this.botdev
        };
    }
};
