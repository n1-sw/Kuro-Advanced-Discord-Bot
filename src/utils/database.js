const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

const ensureDataDir = () => {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
};

const loadData = (filename) => {
    ensureDataDir();
    const filepath = path.join(dataDir, filename);
    if (fs.existsSync(filepath)) {
        try {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return {};
        }
    }
    return {};
};

const saveData = (filename, data) => {
    ensureDataDir();
    const filepath = path.join(dataDir, filename);
    try {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error saving ${filename}:`, error);
    }
};

// ===== USER PROFILES & LEVELS =====
const users = {
    data: loadData('users.json'),
    
    get(guildId, userId) {
        const key = `${guildId}_${userId}`;
        if (!this.data[key]) {
            this.data[key] = {
                userId: userId,
                guildId: guildId,
                xp: 0,
                level: 0,
                coins: require('../config').economy.startingCoins,
                warnings: [],
                lastXpTime: 0,
                lastDaily: 0,
                inventory: [],
                totalMessages: 0,
                createdAt: Date.now(),
                nickname: null,
                bio: null,
                favoriteGame: null
            };
        }
        return this.data[key];
    },
    
    save() {
        saveData('users.json', this.data);
    },
    
    getLeaderboard(guildId, type = 'level', limit = 10) {
        const guildUsers = Object.entries(this.data)
            .filter(([key]) => key.startsWith(guildId))
            .map(([key, data]) => ({ userId: data.userId, ...data }));
        
        if (type === 'level') {
            return guildUsers.sort((a, b) => b.level - a.level || b.xp - a.xp).slice(0, limit);
        } else if (type === 'coins') {
            return guildUsers.sort((a, b) => b.coins - a.coins).slice(0, limit);
        } else if (type === 'messages') {
            return guildUsers.sort((a, b) => b.totalMessages - a.totalMessages).slice(0, limit);
        }
        return guildUsers.slice(0, limit);
    },
    
    updateProfile(guildId, userId, updates) {
        const user = this.get(guildId, userId);
        Object.assign(user, updates);
        this.save();
        return user;
    }
};

// ===== MAIL SYSTEM =====
const mail = {
    data: loadData('mail.json'),
    
    send(guildId, fromId, toId, subject, content) {
        const key = `${guildId}_${toId}`;
        if (!this.data[key]) {
            this.data[key] = [];
        }
        
        const mailItem = {
            id: Date.now().toString(36),
            from: fromId,
            subject,
            content,
            timestamp: Date.now(),
            read: false
        };
        
        this.data[key].push(mailItem);
        this.save();
        return mailItem;
    },
    
    getInbox(guildId, userId) {
        const key = `${guildId}_${userId}`;
        return this.data[key] || [];
    },
    
    markRead(guildId, userId, mailId) {
        const key = `${guildId}_${userId}`;
        if (this.data[key]) {
            const mailItem = this.data[key].find(m => m.id === mailId);
            if (mailItem) {
                mailItem.read = true;
                this.save();
                return true;
            }
        }
        return false;
    },
    
    delete(guildId, userId, mailId) {
        const key = `${guildId}_${userId}`;
        if (this.data[key]) {
            const index = this.data[key].findIndex(m => m.id === mailId);
            if (index !== -1) {
                this.data[key].splice(index, 1);
                this.save();
                return true;
            }
        }
        return false;
    },
    
    getUnreadCount(guildId, userId) {
        const inbox = this.getInbox(guildId, userId);
        return inbox.filter(m => !m.read).length;
    },
    
    save() {
        saveData('mail.json', this.data);
    }
};

// ===== MODERATION LOGS =====
const modLogs = {
    data: loadData('modlogs.json'),
    
    add(guildId, action, moderatorId, targetId, reason) {
        if (!this.data[guildId]) {
            this.data[guildId] = [];
        }
        
        const logEntry = {
            id: Date.now().toString(36),
            action,
            moderatorId,
            targetId,
            reason,
            timestamp: Date.now()
        };
        
        this.data[guildId].push(logEntry);
        this.save();
        return logEntry;
    },
    
    get(guildId, limit = 10) {
        return (this.data[guildId] || []).slice(-limit).reverse();
    },
    
    getByUser(guildId, userId, limit = 10) {
        return (this.data[guildId] || [])
            .filter(log => log.targetId === userId)
            .slice(-limit)
            .reverse();
    },
    
    save() {
        saveData('modlogs.json', this.data);
    }
};

// ===== GUILD SETTINGS & PREFERENCES =====
const guildSettings = {
    data: loadData('guild-settings.json'),
    
    get(guildId) {
        if (!this.data[guildId]) {
            this.data[guildId] = {
                guildId: guildId,
                prefix: '!',
                welcomeChannel: null,
                logsChannel: null,
                automodEnabled: true,
                levelingEnabled: true,
                economyEnabled: true,
                customPrefix: false,
                joinRoles: [],
                mutedRole: null,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
        }
        return this.data[guildId];
    },
    
    update(guildId, updates) {
        const settings = this.get(guildId);
        Object.assign(settings, updates, { updatedAt: Date.now() });
        this.save();
        return settings;
    },
    
    save() {
        saveData('guild-settings.json', this.data);
    }
};

// ===== ECONOMY & TRANSACTIONS =====
const transactions = {
    data: loadData('transactions.json'),
    
    add(guildId, fromUserId, toUserId, amount, type, reason = '') {
        const key = guildId;
        if (!this.data[key]) {
            this.data[key] = [];
        }
        
        const transaction = {
            id: Date.now().toString(36),
            from: fromUserId,
            to: toUserId,
            amount,
            type, // 'transfer', 'shop', 'gamble', 'daily', 'level-up'
            reason,
            timestamp: Date.now()
        };
        
        this.data[key].push(transaction);
        if (this.data[key].length > 10000) {
            this.data[key] = this.data[key].slice(-10000);
        }
        this.save();
        return transaction;
    },
    
    getHistory(guildId, userId, limit = 20) {
        const transactions = this.data[guildId] || [];
        return transactions
            .filter(t => t.from === userId || t.to === userId)
            .slice(-limit)
            .reverse();
    },
    
    save() {
        saveData('transactions.json', this.data);
    }
};

// ===== GAME STATISTICS =====
const gameStats = {
    data: loadData('game-stats.json'),
    
    get(guildId, userId, game) {
        const key = `${guildId}_${userId}`;
        if (!this.data[key]) {
            this.data[key] = {};
        }
        if (!this.data[key][game]) {
            this.data[key][game] = {
                played: 0,
                won: 0,
                lost: 0,
                totalScore: 0,
                bestScore: 0,
                lastPlayed: null,
                createdAt: Date.now()
            };
        }
        return this.data[key][game];
    },
    
    recordGame(guildId, userId, game, won, score = 0) {
        const stats = this.get(guildId, userId, game);
        stats.played++;
        if (won) stats.won++;
        else stats.lost++;
        stats.totalScore += score;
        stats.bestScore = Math.max(stats.bestScore, score);
        stats.lastPlayed = Date.now();
        this.save();
        return stats;
    },
    
    getLeaderboard(guildId, game, limit = 10) {
        const leaderboard = [];
        for (const [key, games] of Object.entries(this.data)) {
            if (key.startsWith(guildId) && games[game]) {
                leaderboard.push({
                    userId: key.split('_')[1],
                    ...games[game]
                });
            }
        }
        return leaderboard.sort((a, b) => b.bestScore - a.bestScore).slice(0, limit);
    },
    
    save() {
        saveData('game-stats.json', this.data);
    }
};

// ===== ANTI-NUKE TRACKING =====
const antiNukeTracking = {
    data: {},
    
    track(guildId, userId, action) {
        const key = `${guildId}_${userId}_${action}`;
        const now = Date.now();
        
        if (!this.data[key]) {
            this.data[key] = [];
        }
        
        this.data[key] = this.data[key].filter(time => now - time < 60000);
        this.data[key].push(now);
        
        return this.data[key].length;
    },
    
    getCount(guildId, userId, action) {
        const key = `${guildId}_${userId}_${action}`;
        const now = Date.now();
        
        if (!this.data[key]) return 0;
        
        this.data[key] = this.data[key].filter(time => now - time < 60000);
        return this.data[key].length;
    }
};

// ===== SPAM TRACKING =====
const spamTracking = {
    data: {},
    
    track(guildId, userId) {
        const key = `${guildId}_${userId}`;
        const now = Date.now();
        const config = require('../config');
        
        if (!this.data[key]) {
            this.data[key] = [];
        }
        
        this.data[key] = this.data[key].filter(time => now - time < config.automod.spamInterval);
        this.data[key].push(now);
        
        return this.data[key].length;
    },
    
    isSpamming(guildId, userId) {
        const config = require('../config');
        return this.track(guildId, userId) >= config.automod.spamThreshold;
    }
};

// ===== USER PREFERENCES & CUSTOMIZATION =====
const userPreferences = {
    data: loadData('user-preferences.json'),
    
    get(guildId, userId) {
        const key = `${guildId}_${userId}`;
        if (!this.data[key]) {
            this.data[key] = {
                userId: userId,
                guildId: guildId,
                dmNotifications: true,
                dailyReminder: false,
                profilePrivate: false,
                theme: 'default',
                language: 'en',
                createdAt: Date.now()
            };
        }
        return this.data[key];
    },
    
    update(guildId, userId, updates) {
        const prefs = this.get(guildId, userId);
        Object.assign(prefs, updates);
        this.save();
        return prefs;
    },
    
    save() {
        saveData('user-preferences.json', this.data);
    }
};

// ===== SYSTEM CACHE & MEMORY =====
const cache = {
    data: {},
    ttl: {},
    
    set(key, value, ttlMs = 3600000) {
        this.data[key] = value;
        this.ttl[key] = Date.now() + ttlMs;
    },
    
    get(key) {
        if (this.ttl[key] && Date.now() > this.ttl[key]) {
            delete this.data[key];
            delete this.ttl[key];
            return null;
        }
        return this.data[key] || null;
    },
    
    has(key) {
        return this.get(key) !== null;
    },
    
    delete(key) {
        delete this.data[key];
        delete this.ttl[key];
    },
    
    clear() {
        this.data = {};
        this.ttl = {};
    }
};

module.exports = {
    users,
    mail,
    modLogs,
    guildSettings,
    transactions,
    gameStats,
    antiNukeTracking,
    spamTracking,
    userPreferences,
    cache
};
