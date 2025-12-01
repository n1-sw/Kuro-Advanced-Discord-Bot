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
                totalMessages: 0
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
        }
        return guildUsers.slice(0, limit);
    }
};

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

module.exports = {
    users,
    mail,
    modLogs,
    antiNukeTracking,
    spamTracking
};
