module.exports = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    pending: '⏳',
    info: 'ℹ️',
    
    bot: '🤖',
    lock: '🔐',
    unlock: '🔓',
    rocket: '🚀',
    sparkles: '✨',
    bell: '🔔',
    gear: '🔧',
    search: '🔍',
    refresh: '🔄',
    
    blocked: '🚫',
    trash: '🗑️',
    delete: '🗑️',
    cancel: '❌',
    confirm: '✅',
    yes: '✅',
    no: '❌',
    
    moderation: '🛡️',
    leveling: '📊',
    economy: '💰',
    mail: '📬',
    games: '🎮',
    botdev: '🔧',
    admin: '👑',
    
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
    
    id: '🆔',
    keys: '🔑',
    
    zap: '⚡',
    fire: '🔥',
    gamble: '🎰',
    
    clock: '⏰',
    timer: '⏱️',
    hourglass: '⏳',
    pause: '⏸️',
    
    dice: '🎲',
    cards: '🃏',
    snake: '🐍',
    chess: '♟️',
    tictactoe: '⭕',
    
    person: '👤',
    people: '👥',
    owner: '👑',
    developer: '👨‍💻',
    
    gold_medal: '🥇',
    silver_medal: '🥈',
    bronze_medal: '🥉',
    trophy: '🏆',
    
    heart: '❤️',
    announcement: '📢',
    party: '🎉',
    credit_card: '💳',
    server: '🖥️',
    world: '🌍',
    wave: '👋',
    
    automod: '🛡️',
    rule: '📋',
    keyword: '🔑',
    action: '⚡',
    status: '📊',
    
    pipe: '│',
    arrow_right: '→',
    arrow_left: '←',
    divider: '═',
    
    settings: '⚙️',
    
    book: '📚',
    bulb: '💡',
    links: '🔗',
    members: '📌',
    messages: '💬',
    
    cpu: '💻',
    ram: '🧠',
    uptime: '⏱️',
    health: '💓',
    online: '🟢',
    offline: '🔴',
    
    // COLORS & THEMES
    color_economy: 0xFFD700,
    color_leveling: 0x9370DB,
    color_games: 0xFF6B9D,
    color_moderation: 0xFF4444,
    color_mail: 0x00BFFF,
    color_user: 0x00CED1,
    color_success: 0x00FF00,
    color_error: 0xFF0000,
    color_warning: 0xFFA500,
    color_info: 0x5865F2,
    color_primary: 0x5865F2,
    
    // GAME EMOJIS
    slot_seven: '7️⃣',
    slot_cherry: '🍒',
    slot_lemon: '🍋',
    slot_orange: '🍊',
    slot_grape: '🍇',
    
    // SPECIAL ICONS
    crown: '👑',
    medal: '🏅',
    gem: '💎',
    wave_hand: '👋',
    megaphone: '📢',
    channel: '📢',
    money_bag: '💰',
    bank: '🏦',
    shop: '🛍️',
    vendor: '🏪',
    chart: '📈',
    pie_chart: '📊',
    lightning: '⚡',
    sun: '☀️',
    moon: '🌙',
    sparkle: '✨',
    
    rank_legendary: '👑',
    rank_master: '🔥',
    rank_expert: '💎',
    rank_veteran: '⚔️',
    rank_advanced: '🌟',
    rank_intermediate: '✨',
    rank_beginner: '🌱',
    rank_newcomer: '🆕',
    
    getCategory(category) {
        const categoryMap = {
            'moderation': this.moderation,
            'leveling': this.leveling,
            'economy': this.economy,
            'mail': this.mail,
            'games': this.games,
            'bot-dev': this.botdev,
            'server-management': this.admin
        };
        return categoryMap[category] || '•';
    },
    
    getAllCategories() {
        return {
            'moderation': this.moderation,
            'leveling': this.leveling,
            'economy': this.economy,
            'mail': this.mail,
            'games': this.games,
            'bot-dev': this.botdev,
            'server-management': this.admin
        };
    }
};
