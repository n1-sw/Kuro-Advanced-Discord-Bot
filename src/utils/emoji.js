module.exports = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    pending: '⏳',
    info: 'ℹ️',
    alert: '🚨',
    
    bot: '🤖',
    lock: '🔐',
    unlock: '🔓',
    rocket: '🚀',
    sparkles: '✨',
    bell: '🔔',
    gear: '⚙️',
    search: '🔍',
    refresh: '🔄',
    sync: '🔄',
    
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
    fun: '🎉',
    utility: '🔨',
    
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
    key: '🔑',
    
    zap: '⚡',
    fire: '🔥',
    gamble: '🎰',
    
    clock: '⏰',
    timer: '⏱️',
    hourglass: '⏳',
    pause: '⏸️',
    play: '▶️',
    stop: '⏹️',
    
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
    broken_heart: '💔',
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
    arrow_up: '↑',
    arrow_down: '↓',
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
    idle: '🟡',
    dnd: '🔴',
    
    eightball: '🎱',
    thinking: '🤔',
    question: '❓',
    exclamation: '❗',
    rock: '🪨',
    paper: '📄',
    scissors: '✂️',
    laugh: '😂',
    joke: '🃏',
    quote: '💭',
    fact: '📖',
    trivia: '🧠',
    wouldyourather: '🤷',
    meme: '😆',
    
    console: '🖥️',
    terminal: '💻',
    database: '🗄️',
    mongodb: '🍃',
    
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
    color_fun: 0xFF69B4,
    color_console: 0x2F3136,
    
    slot_seven: '7️⃣',
    slot_cherry: '🍒',
    slot_lemon: '🍋',
    slot_orange: '🍊',
    slot_grape: '🍇',
    slot_watermelon: '🍉',
    slot_star: '⭐',
    slot_diamond: '💎',
    
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
    rainbow: '🌈',
    
    rank_legendary: '👑',
    rank_master: '🔥',
    rank_expert: '💎',
    rank_veteran: '⚔️',
    rank_advanced: '🌟',
    rank_intermediate: '✨',
    rank_beginner: '🌱',
    rank_newcomer: '🆕',
    
    thumbs_up: '👍',
    thumbs_down: '👎',
    clap: '👏',
    muscle: '💪',
    eyes: '👀',
    brain: '🧠',
    magic: '🪄',
    crystal_ball: '🔮',
    
    getCategory(category) {
        const categoryMap = {
            'moderation': this.moderation,
            'leveling': this.leveling,
            'economy': this.economy,
            'mail': this.mail,
            'games': this.games,
            'bot-dev': this.botdev,
            'server-management': this.admin,
            'fun': this.fun
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
            'server-management': this.admin,
            'fun': this.fun
        };
    },
    
    getRankBadge(level) {
        if (level >= 100) return this.rank_legendary;
        if (level >= 75) return this.rank_master;
        if (level >= 50) return this.rank_expert;
        if (level >= 30) return this.rank_veteran;
        if (level >= 15) return this.rank_advanced;
        if (level >= 5) return this.rank_intermediate;
        if (level >= 1) return this.rank_beginner;
        return this.rank_newcomer;
    }
};
