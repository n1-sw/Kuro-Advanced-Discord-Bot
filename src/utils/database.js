const fs = require('fs');
const path = require('path');
const { connectDB, isDBConnected, User, Mail, ModLog, GuildSettings, Transaction, GameStat, AutomodViolation } = require('./mongodb');
const emoji = require('./emoji');

const dataDir = path.join(__dirname, '../data');

const ensureDataDir = () => {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
};

const loadJsonData = (filename) => {
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

const saveJsonData = (filename, data) => {
    ensureDataDir();
    const filepath = path.join(dataDir, filename);
    try {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error saving ${filename}:`, error);
    }
};

const users = {
    cache: loadJsonData('users.json'),
    
    async get(guildId, odId) {
        const uniqueId = `${guildId}_${odId}`;
        
        if (isDBConnected()) {
            try {
                let user = await User.findOne({ uniqueId });
                if (!user) {
                    const config = require('../config');
                    user = await User.create({
                        uniqueId,
                        guildId,
                        odId,
                        coins: config.economy.startingCoins
                    });
                }
                return user.toObject();
            } catch (error) {
                console.error('MongoDB user get error:', error.message);
            }
        }
        
        if (!this.cache[uniqueId]) {
            const config = require('../config');
            this.cache[uniqueId] = {
                odId,
                guildId,
                xp: 0,
                level: 0,
                coins: config.economy.startingCoins,
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
            this.save();
        }
        return this.cache[uniqueId];
    },
    
    async update(guildId, odId, updates) {
        const uniqueId = `${guildId}_${odId}`;
        
        if (isDBConnected()) {
            try {
                const user = await User.findOneAndUpdate(
                    { uniqueId },
                    { ...updates, updatedAt: new Date() },
                    { new: true, upsert: true }
                );
                return user.toObject();
            } catch (error) {
                console.error('MongoDB user update error:', error.message);
            }
        }
        
        const user = await this.get(guildId, odId);
        Object.assign(user, updates);
        this.cache[uniqueId] = user;
        this.save();
        return user;
    },
    
    async getLeaderboard(guildId, type = 'level', limit = 10) {
        if (isDBConnected()) {
            try {
                const sortField = type === 'level' ? { level: -1, xp: -1 } : 
                                  type === 'coins' ? { coins: -1 } : { totalMessages: -1 };
                const users = await User.find({ guildId }).sort(sortField).limit(limit);
                return users.map(u => u.toObject());
            } catch (error) {
                console.error('MongoDB leaderboard error:', error.message);
            }
        }
        
        const guildUsers = Object.entries(this.cache)
            .filter(([key]) => key.startsWith(guildId))
            .map(([key, data]) => ({ odId: data.odId, ...data }));
        
        if (type === 'level') {
            return guildUsers.sort((a, b) => b.level - a.level || b.xp - a.xp).slice(0, limit);
        } else if (type === 'coins') {
            return guildUsers.sort((a, b) => b.coins - a.coins).slice(0, limit);
        } else if (type === 'messages') {
            return guildUsers.sort((a, b) => b.totalMessages - a.totalMessages).slice(0, limit);
        }
        return guildUsers.slice(0, limit);
    },
    
    save() {
        saveJsonData('users.json', this.cache);
    }
};

const mail = {
    cache: loadJsonData('mail.json'),
    
    async send(guildId, fromId, toId, subject, content) {
        const mailItem = {
            mailId: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            guildId,
            fromUserId: fromId,
            toUserId: toId,
            subject,
            content,
            read: false,
            timestamp: Date.now()
        };
        
        if (isDBConnected()) {
            try {
                await Mail.create(mailItem);
                return mailItem;
            } catch (error) {
                console.error('MongoDB mail send error:', error.message);
            }
        }
        
        const key = `${guildId}_${toId}`;
        if (!this.cache[key]) {
            this.cache[key] = [];
        }
        this.cache[key].push(mailItem);
        this.save();
        return mailItem;
    },
    
    async getInbox(guildId, odId) {
        if (isDBConnected()) {
            try {
                const mails = await Mail.find({ guildId, toUserId: odId }).sort({ timestamp: -1 });
                return mails.map(m => m.toObject());
            } catch (error) {
                console.error('MongoDB inbox error:', error.message);
            }
        }
        
        const key = `${guildId}_${odId}`;
        return this.cache[key] || [];
    },
    
    async markRead(guildId, odId, mailId) {
        if (isDBConnected()) {
            try {
                await Mail.updateOne({ mailId, guildId, toUserId: odId }, { read: true });
                return true;
            } catch (error) {
                console.error('MongoDB markRead error:', error.message);
            }
        }
        
        const key = `${guildId}_${odId}`;
        if (this.cache[key]) {
            const mailItem = this.cache[key].find(m => m.mailId === mailId || m.id === mailId);
            if (mailItem) {
                mailItem.read = true;
                this.save();
                return true;
            }
        }
        return false;
    },
    
    async delete(guildId, odId, mailId) {
        if (isDBConnected()) {
            try {
                await Mail.deleteOne({ mailId, guildId, toUserId: odId });
                return true;
            } catch (error) {
                console.error('MongoDB delete mail error:', error.message);
            }
        }
        
        const key = `${guildId}_${odId}`;
        if (this.cache[key]) {
            const index = this.cache[key].findIndex(m => m.mailId === mailId || m.id === mailId);
            if (index !== -1) {
                this.cache[key].splice(index, 1);
                this.save();
                return true;
            }
        }
        return false;
    },
    
    async getUnreadCount(guildId, odId) {
        const inbox = await this.getInbox(guildId, odId);
        return inbox.filter(m => !m.read).length;
    },
    
    save() {
        saveJsonData('mail.json', this.cache);
    }
};

const modLogs = {
    cache: loadJsonData('modlogs.json'),
    
    async add(guildId, action, moderatorId, targetId, reason) {
        const logEntry = {
            logId: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            guildId,
            action,
            moderatorId,
            targetId,
            reason: reason || 'No reason provided',
            timestamp: Date.now()
        };
        
        if (isDBConnected()) {
            try {
                await ModLog.create(logEntry);
                return logEntry;
            } catch (error) {
                console.error('MongoDB modlog add error:', error.message);
            }
        }
        
        if (!this.cache[guildId]) {
            this.cache[guildId] = [];
        }
        this.cache[guildId].push(logEntry);
        this.save();
        return logEntry;
    },
    
    async get(guildId, limit = 10) {
        if (isDBConnected()) {
            try {
                const logs = await ModLog.find({ guildId }).sort({ timestamp: -1 }).limit(limit);
                return logs.map(l => l.toObject());
            } catch (error) {
                console.error('MongoDB modlog get error:', error.message);
            }
        }
        
        return (this.cache[guildId] || []).slice(-limit).reverse();
    },
    
    async getByUser(guildId, odId, limit = 10) {
        if (isDBConnected()) {
            try {
                const logs = await ModLog.find({ guildId, targetId: odId }).sort({ timestamp: -1 }).limit(limit);
                return logs.map(l => l.toObject());
            } catch (error) {
                console.error('MongoDB modlog getByUser error:', error.message);
            }
        }
        
        return (this.cache[guildId] || [])
            .filter(log => log.targetId === odId)
            .slice(-limit)
            .reverse();
    },
    
    save() {
        saveJsonData('modlogs.json', this.cache);
    }
};

const guildSettings = {
    cache: loadJsonData('guild-settings.json'),
    
    async get(guildId) {
        if (isDBConnected()) {
            try {
                let settings = await GuildSettings.findOne({ guildId });
                if (!settings) {
                    settings = await GuildSettings.create({ guildId });
                }
                const obj = settings.toObject();
                if (obj.autoReactKeywords instanceof Map) {
                    obj.autoReactKeywords = Object.fromEntries(obj.autoReactKeywords);
                }
                return obj;
            } catch (error) {
                console.error('MongoDB guildSettings get error:', error.message);
            }
        }
        
        if (!this.cache[guildId]) {
            this.cache[guildId] = {
                guildId,
                prefix: '!',
                welcomeChannel: null,
                welcomeMessage: null,
                leaveChannel: null,
                leaveMessage: null,
                logsChannel: null,
                automodEnabled: true,
                levelingEnabled: true,
                economyEnabled: true,
                joinRoles: [],
                mutedRole: null,
                autoReactEnabled: true,
                autoReactKeywords: {},
                mentionReactionsEnabled: false,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            this.save();
        }
        return this.cache[guildId];
    },
    
    async update(guildId, updates) {
        if (isDBConnected()) {
            try {
                const settings = await GuildSettings.findOneAndUpdate(
                    { guildId },
                    { ...updates, updatedAt: new Date() },
                    { new: true, upsert: true }
                );
                const obj = settings.toObject();
                if (obj.autoReactKeywords instanceof Map) {
                    obj.autoReactKeywords = Object.fromEntries(obj.autoReactKeywords);
                }
                return obj;
            } catch (error) {
                console.error('MongoDB guildSettings update error:', error.message);
            }
        }
        
        const settings = await this.get(guildId);
        Object.assign(settings, updates, { updatedAt: Date.now() });
        this.cache[guildId] = settings;
        this.save();
        return settings;
    },
    
    save() {
        saveJsonData('guild-settings.json', this.cache);
    }
};

const transactions = {
    cache: loadJsonData('transactions.json'),
    
    async add(guildId, fromUserId, toUserId, amount, type, reason = '') {
        const transaction = {
            transactionId: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            guildId,
            fromUserId,
            toUserId,
            amount,
            type,
            reason,
            timestamp: Date.now()
        };
        
        if (isDBConnected()) {
            try {
                await Transaction.create(transaction);
                return transaction;
            } catch (error) {
                console.error('MongoDB transaction add error:', error.message);
            }
        }
        
        if (!this.cache[guildId]) {
            this.cache[guildId] = [];
        }
        this.cache[guildId].push(transaction);
        if (this.cache[guildId].length > 10000) {
            this.cache[guildId] = this.cache[guildId].slice(-10000);
        }
        this.save();
        return transaction;
    },
    
    async getHistory(guildId, odId, limit = 20) {
        if (isDBConnected()) {
            try {
                const txns = await Transaction.find({
                    guildId,
                    $or: [{ fromUserId: odId }, { toUserId: odId }]
                }).sort({ timestamp: -1 }).limit(limit);
                return txns.map(t => t.toObject());
            } catch (error) {
                console.error('MongoDB transaction history error:', error.message);
            }
        }
        
        const transactions = this.cache[guildId] || [];
        return transactions
            .filter(t => t.fromUserId === odId || t.toUserId === odId)
            .slice(-limit)
            .reverse();
    },
    
    save() {
        saveJsonData('transactions.json', this.cache);
    }
};

const gameStats = {
    cache: loadJsonData('game-stats.json'),
    
    async get(guildId, odId, game) {
        const uniqueId = `${guildId}_${odId}_${game}`;
        
        if (isDBConnected()) {
            try {
                let stats = await GameStat.findOne({ uniqueId });
                if (!stats) {
                    stats = await GameStat.create({ uniqueId, guildId, odId, game });
                }
                return stats.toObject();
            } catch (error) {
                console.error('MongoDB gameStats get error:', error.message);
            }
        }
        
        const key = `${guildId}_${odId}`;
        if (!this.cache[key]) {
            this.cache[key] = {};
        }
        if (!this.cache[key][game]) {
            this.cache[key][game] = {
                played: 0,
                won: 0,
                lost: 0,
                totalScore: 0,
                bestScore: 0,
                lastPlayed: null,
                createdAt: Date.now()
            };
        }
        return this.cache[key][game];
    },
    
    async recordGame(guildId, odId, game, won, score = 0) {
        const uniqueId = `${guildId}_${odId}_${game}`;
        
        if (isDBConnected()) {
            try {
                const update = {
                    $inc: { played: 1, totalScore: score },
                    lastPlayed: new Date()
                };
                if (won) update.$inc.won = 1;
                else update.$inc.lost = 1;
                
                const stats = await GameStat.findOneAndUpdate(
                    { uniqueId },
                    update,
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
                
                if (score > (stats.bestScore || 0)) {
                    await GameStat.updateOne({ uniqueId }, { bestScore: score });
                }
                
                return stats.toObject();
            } catch (error) {
                console.error('MongoDB recordGame error:', error.message);
            }
        }
        
        const stats = await this.get(guildId, odId, game);
        stats.played++;
        if (won) stats.won++;
        else stats.lost++;
        stats.totalScore += score;
        stats.bestScore = Math.max(stats.bestScore, score);
        stats.lastPlayed = Date.now();
        this.save();
        return stats;
    },
    
    async getLeaderboard(guildId, game, limit = 10) {
        if (isDBConnected()) {
            try {
                const stats = await GameStat.find({ guildId, game }).sort({ bestScore: -1 }).limit(limit);
                return stats.map(s => s.toObject());
            } catch (error) {
                console.error('MongoDB game leaderboard error:', error.message);
            }
        }
        
        const leaderboard = [];
        for (const [key, games] of Object.entries(this.cache)) {
            if (key.startsWith(guildId) && games[game]) {
                leaderboard.push({
                    odId: key.split('_')[1],
                    ...games[game]
                });
            }
        }
        return leaderboard.sort((a, b) => b.bestScore - a.bestScore).slice(0, limit);
    },
    
    save() {
        saveJsonData('game-stats.json', this.cache);
    }
};

const automodViolations = {
    async add(guildId, odId, violationType, messageContent, action) {
        if (isDBConnected()) {
            try {
                await AutomodViolation.create({
                    guildId,
                    odId,
                    violationType,
                    messageContent: messageContent.substring(0, 500),
                    action
                });
            } catch (error) {
                console.error('MongoDB automod violation error:', error.message);
            }
        }
    },
    
    async getViolations(guildId, odId, limit = 20) {
        if (isDBConnected()) {
            try {
                const violations = await AutomodViolation.find({ guildId, odId })
                    .sort({ timestamp: -1 })
                    .limit(limit);
                return violations.map(v => v.toObject());
            } catch (error) {
                console.error('MongoDB get violations error:', error.message);
            }
        }
        return [];
    },
    
    async getViolationCount(guildId, odId, violationType, timeWindowMs = 3600000) {
        if (isDBConnected()) {
            try {
                const since = new Date(Date.now() - timeWindowMs);
                return await AutomodViolation.countDocuments({
                    guildId,
                    odId,
                    violationType,
                    timestamp: { $gte: since }
                });
            } catch (error) {
                console.error('MongoDB violation count error:', error.message);
            }
        }
        return 0;
    }
};

const antiNukeTracking = {
    data: {},
    
    track(guildId, odId, action) {
        const key = `${guildId}_${odId}_${action}`;
        const now = Date.now();
        
        if (!this.data[key]) {
            this.data[key] = [];
        }
        
        this.data[key] = this.data[key].filter(time => now - time < 60000);
        this.data[key].push(now);
        
        return this.data[key].length;
    },
    
    getCount(guildId, odId, action) {
        const key = `${guildId}_${odId}_${action}`;
        const now = Date.now();
        
        if (!this.data[key]) return 0;
        
        this.data[key] = this.data[key].filter(time => now - time < 60000);
        return this.data[key].length;
    }
};

const spamTracking = {
    data: {},
    
    track(guildId, odId) {
        const key = `${guildId}_${odId}`;
        const now = Date.now();
        const config = require('../config');
        
        if (!this.data[key]) {
            this.data[key] = [];
        }
        
        this.data[key] = this.data[key].filter(time => now - time < config.automod.spamInterval);
        this.data[key].push(now);
        
        return this.data[key].length;
    },
    
    isSpamming(guildId, odId) {
        const config = require('../config');
        return this.track(guildId, odId) >= config.automod.spamThreshold;
    }
};

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
    connectDB,
    isDBConnected,
    users,
    mail,
    modLogs,
    guildSettings,
    transactions,
    gameStats,
    automodViolations,
    antiNukeTracking,
    spamTracking,
    cache
};
