const emoji = require('./emoji');

class EmojiManager {
    constructor(client) {
        this.client = client;
        this.emojiCache = [];
        this.lastCacheUpdate = 0;
        this.cacheLifetime = 300000;
    }
    
    async refreshCache() {
        if (!this.client?.isReady()) return [];
        
        const now = Date.now();
        if (now - this.lastCacheUpdate < this.cacheLifetime && this.emojiCache.length > 0) {
            return this.emojiCache;
        }
        
        try {
            const emojis = [];
            
            for (const guild of this.client.guilds.cache.values()) {
                try {
                    const botMember = guild.members.cache.get(this.client.user.id);
                    if (!botMember) continue;
                    
                    for (const guildEmoji of guild.emojis.cache.values()) {
                        if (!guildEmoji.available) continue;
                        
                        const canUse = guildEmoji.roles.cache.size === 0 || 
                            guildEmoji.roles.cache.some(role => botMember.roles.cache.has(role.id));
                        
                        if (canUse) {
                            emojis.push({
                                id: guildEmoji.id,
                                name: guildEmoji.name,
                                animated: guildEmoji.animated,
                                guildId: guild.id,
                                guildName: guild.name,
                                toString: () => guildEmoji.toString(),
                                identifier: guildEmoji.identifier
                            });
                        }
                    }
                } catch (err) {
                }
            }
            
            this.emojiCache = emojis;
            this.lastCacheUpdate = now;
            
            console.log(`${emoji.success} Emoji cache refreshed: ${emojis.length} emojis from ${this.client.guilds.cache.size} servers`);
            
            return emojis;
        } catch (error) {
            console.error(`${emoji.error} Failed to refresh emoji cache:`, error.message);
            return this.emojiCache;
        }
    }
    
    async getRandomEmoji(options = {}) {
        const { 
            animated = null,
            excludeGuildId = null,
            preferOtherServers = true
        } = options;
        
        let emojis = await this.refreshCache();
        
        if (emojis.length === 0) {
            const fallbackEmojis = ['😀', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯', '🙌', '👀', '💪', '🤩', '😎', '🥳', '💖', '⭐', '🌟', '💫', '🎯', '🏆'];
            return fallbackEmojis[Math.floor(Math.random() * fallbackEmojis.length)];
        }
        
        if (animated !== null) {
            emojis = emojis.filter(e => e.animated === animated);
        }
        
        if (excludeGuildId && preferOtherServers) {
            const otherServerEmojis = emojis.filter(e => e.guildId !== excludeGuildId);
            if (otherServerEmojis.length > 0) {
                emojis = otherServerEmojis;
            }
        }
        
        if (emojis.length === 0) {
            const fallbackEmojis = ['😀', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯'];
            return fallbackEmojis[Math.floor(Math.random() * fallbackEmojis.length)];
        }
        
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        return randomEmoji.toString();
    }
    
    async getRandomEmojis(count = 3, options = {}) {
        const emojis = await this.refreshCache();
        const results = [];
        const used = new Set();
        
        if (emojis.length === 0) {
            const fallbackEmojis = ['😀', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯', '🙌', '👀'];
            for (let i = 0; i < Math.min(count, fallbackEmojis.length); i++) {
                let idx;
                do {
                    idx = Math.floor(Math.random() * fallbackEmojis.length);
                } while (used.has(idx) && used.size < fallbackEmojis.length);
                used.add(idx);
                results.push(fallbackEmojis[idx]);
            }
            return results;
        }
        
        let filteredEmojis = [...emojis];
        if (options.excludeGuildId && options.preferOtherServers) {
            const otherServerEmojis = filteredEmojis.filter(e => e.guildId !== options.excludeGuildId);
            if (otherServerEmojis.length >= count) {
                filteredEmojis = otherServerEmojis;
            }
        }
        
        for (let i = 0; i < Math.min(count, filteredEmojis.length); i++) {
            let idx;
            let attempts = 0;
            do {
                idx = Math.floor(Math.random() * filteredEmojis.length);
                attempts++;
            } while (used.has(idx) && attempts < 50 && used.size < filteredEmojis.length);
            
            if (!used.has(idx)) {
                used.add(idx);
                results.push(filteredEmojis[idx].toString());
            }
        }
        
        return results;
    }
    
    async getEmojisByGuild(guildId) {
        const emojis = await this.refreshCache();
        return emojis.filter(e => e.guildId === guildId);
    }
    
    async searchEmojis(query) {
        const emojis = await this.refreshCache();
        const lowerQuery = query.toLowerCase();
        return emojis.filter(e => e.name.toLowerCase().includes(lowerQuery));
    }
    
    getStats() {
        return {
            totalEmojis: this.emojiCache.length,
            animatedEmojis: this.emojiCache.filter(e => e.animated).length,
            staticEmojis: this.emojiCache.filter(e => !e.animated).length,
            serverCount: new Set(this.emojiCache.map(e => e.guildId)).size,
            lastUpdate: this.lastCacheUpdate,
            cacheAge: Date.now() - this.lastCacheUpdate
        };
    }
}

module.exports = EmojiManager;
