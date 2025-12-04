const { users, spamTracking, mail, guildSettings, automodViolations } = require('../utils/database');
const { successEmbed, calculateXpForLevel, randomInt } = require('../utils/helpers');
const config = require('../config');
const emoji = require('../utils/emoji');

const defaultEmojis = ['😀', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯', '🙌', '👀', '💪', '🤩', '😎', '🥳', '💖', '⭐', '🌟', '💫', '🎯', '🏆', '😊', '🥰', '😍', '🤗', '👏', '🙏', '💕', '💗', '🌈', '🎊'];

module.exports = {
    name: 'messageCreate',
    
    async execute(message, client) {
        if (!message.guild) return;
        if (message.author.bot) return;
        
        await this.handleAutoMod(message, client);
        await this.handleAutoReactions(message, client);
        await this.handleLeveling(message);
        await this.checkMail(message);
    },
    
    async handleAutoReactions(message, client) {
        if (!message.content) return;
        
        try {
            const settings = await guildSettings.get(message.guild.id);
            
            if (!settings.autoReactEnabled) return;
            
            const content = message.content.toLowerCase();
            const keywords = settings.autoReactKeywords || {};
            
            for (const [keyword, reactionEmoji] of Object.entries(keywords)) {
                if (keyword && keyword.length > 0 && content.includes(keyword.toLowerCase())) {
                    try {
                        const customEmojiMatch = reactionEmoji.match(/<a?:(\w+):(\d+)>/);
                        
                        if (customEmojiMatch) {
                            const emojiId = customEmojiMatch[2];
                            const guildEmoji = message.guild.emojis.cache.get(emojiId);
                            if (guildEmoji) {
                                await message.react(guildEmoji);
                            } else {
                                await message.react(defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)]);
                            }
                        } else {
                            await message.react(reactionEmoji);
                        }
                    } catch (error) {
                    }
                    break;
                }
            }
            
            if (settings.mentionReactionsEnabled && message.mentions.users.size > 0) {
                if (!message.mentions.has(message.client.user.id)) {
                    const randomChance = Math.random();
                    if (randomChance < 0.7) {
                        let randomEmoji = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
                        
                        if (client.emojiManager && Math.random() < 0.3) {
                            try {
                                const guildEmojis = await client.emojiManager.getEmojisByGuild(message.guild.id);
                                if (guildEmojis.length > 0) {
                                    const randomGuildEmoji = guildEmojis[Math.floor(Math.random() * guildEmojis.length)];
                                    const emojiObj = message.guild.emojis.cache.get(randomGuildEmoji.id);
                                    if (emojiObj) {
                                        randomEmoji = emojiObj;
                                    }
                                }
                            } catch (err) {
                            }
                        }
                        
                        try {
                            await message.react(randomEmoji);
                        } catch (error) {
                            if (error.code === 10014 || error.code === 50013) {
                                try {
                                    const fallback = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
                                    await message.react(fallback);
                                } catch (e) {
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
        }
    },
    
    async handleAutoMod(message, client) {
        if (!config.automod.enabled) return;
        if (!message.member) return;
        if (message.member.permissions.has('Administrator')) return;
        if (!message.content) return;
        
        try {
            const guildId = message.guild.id;
            const odId = message.author.id;
            const content = message.content;
            const lowerContent = content.toLowerCase();
            
            if (config.automod.spamDetection?.enabled !== false) {
                if (spamTracking.isSpamming(guildId, odId)) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, please stop spamming!`);
                        setTimeout(() => warning.delete().catch(() => {}), 5000);
                        
                        const userData = await users.get(guildId, odId);
                        userData.warnings.push({
                            reason: 'Message Spam',
                            moderator: client.user.id,
                            timestamp: Date.now()
                        });
                        await users.update(guildId, odId, { warnings: userData.warnings });
                        
                        await automodViolations.add(guildId, odId, 'spam', content, 'delete');
                        
                        console.log(`${emoji.warning} Spam detected from ${message.author.tag} in ${message.guild.name}`);
                        
                        if (userData.warnings.length >= config.automod.muteThreshold) {
                            if (message.member.moderatable) {
                                await message.member.timeout(10 * 60 * 1000, 'AutoMod: Excessive spam').catch(() => {});
                                console.log(`${emoji.success} Muted ${message.author.tag} for excessive spam`);
                            }
                        }
                    } catch (error) {
                        console.error('AutoMod spam error:', error.message);
                    }
                    return;
                }
            }
            
            if (config.automod.badWordDetection?.enabled !== false) {
                const hasBadWord = config.automod.badWords.some(word => {
                    const wordLower = word.toLowerCase();
                    const wordPattern = new RegExp(`\\b${wordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                    return wordPattern.test(lowerContent) || lowerContent.includes(wordLower);
                });
                
                if (hasBadWord) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, please watch your language!`);
                        setTimeout(() => warning.delete().catch(() => {}), 5000);
                        
                        const userData = await users.get(guildId, odId);
                        userData.warnings.push({
                            reason: 'Profanity',
                            moderator: client.user.id,
                            timestamp: Date.now()
                        });
                        await users.update(guildId, odId, { warnings: userData.warnings });
                        
                        await automodViolations.add(guildId, odId, 'profanity', '[redacted]', 'delete');
                        
                        console.log(`${emoji.warning} Bad word detected from ${message.author.tag}`);
                        
                        if (userData.warnings.length >= config.automod.muteThreshold) {
                            if (message.member.moderatable) {
                                await message.member.timeout(10 * 60 * 1000, 'AutoMod: Profanity').catch(() => {});
                            }
                        }
                    } catch (error) {
                        console.error('AutoMod bad word error:', error.message);
                    }
                    return;
                }
            }
            
            const mentionCount = message.mentions.users.size + message.mentions.roles.size;
            if (mentionCount > config.automod.maxMentions) {
                try {
                    await message.delete();
                    const warning = await message.channel.send(`${emoji.warning} ${message.author}, too many mentions!`);
                    setTimeout(() => warning.delete().catch(() => {}), 5000);
                    
                    const userData = await users.get(guildId, odId);
                    userData.warnings.push({
                        reason: 'Mention Spam',
                        moderator: client.user.id,
                        timestamp: Date.now()
                    });
                    await users.update(guildId, odId, { warnings: userData.warnings });
                    
                    await automodViolations.add(guildId, odId, 'mention_spam', content, 'delete');
                    
                    console.log(`${emoji.warning} Mention spam from ${message.author.tag} (${mentionCount} mentions)`);
                } catch (error) {
                    console.error('AutoMod mentions error:', error.message);
                }
                return;
            }
            
            if (config.automod.capsDetection?.enabled && content.length > 10) {
                const capsCount = (content.match(/[A-Z]/g) || []).length;
                const capsPercentage = (capsCount / content.length) * 100;
                const threshold = config.automod.capsDetection?.threshold || 70;
                
                if (capsPercentage > threshold) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, no excessive caps!`);
                        setTimeout(() => warning.delete().catch(() => {}), 3000);
                        
                        await automodViolations.add(guildId, odId, 'caps_spam', content, 'delete');
                        
                        console.log(`${emoji.warning} Caps spam from ${message.author.tag} (${Math.round(capsPercentage)}%)`);
                    } catch (error) {
                        console.error('AutoMod caps detection error:', error.message);
                    }
                    return;
                }
            }
            
            if (config.automod.repeatDetection?.enabled) {
                const repeatRegex = /(.)\1{5,}/g;
                if (repeatRegex.test(content)) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, no character spam!`);
                        setTimeout(() => warning.delete().catch(() => {}), 3000);
                        
                        await automodViolations.add(guildId, odId, 'repeat_spam', content, 'delete');
                        
                        console.log(`${emoji.warning} Character repeat spam from ${message.author.tag}`);
                    } catch (error) {
                        console.error('AutoMod repeat detection error:', error.message);
                    }
                    return;
                }
            }
            
            if (config.automod.linkDetection?.enabled && !message.member.permissions.has('ManageMessages')) {
                const discordInviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/gi;
                
                const invites = lowerContent.match(discordInviteRegex);
                if (invites && invites.length > 0) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, no invite links!`);
                        setTimeout(() => warning.delete().catch(() => {}), 3000);
                        
                        await automodViolations.add(guildId, odId, 'invite_link', '[link removed]', 'delete');
                        
                        console.log(`${emoji.warning} Invite link from ${message.author.tag}`);
                    } catch (error) {
                        console.error('AutoMod invite detection error:', error.message);
                    }
                    return;
                }
            }
            
            if (config.automod.emojiDetection?.enabled) {
                const emojiRegex = /\p{Emoji}/gu;
                const emojiCount = (content.match(emojiRegex) || []).length;
                
                if (emojiCount > (config.automod.maxEmojis || 10)) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, too many emojis!`);
                        setTimeout(() => warning.delete().catch(() => {}), 3000);
                        
                        await automodViolations.add(guildId, odId, 'emoji_spam', content, 'delete');
                        
                        console.log(`${emoji.warning} Emoji spam from ${message.author.tag} (${emojiCount} emojis)`);
                    } catch (error) {
                        console.error('AutoMod emoji detection error:', error.message);
                    }
                    return;
                }
            }
            
        } catch (error) {
            console.error('Unexpected error in automod handler:', error.message);
        }
    },
    
    async handleLeveling(message) {
        try {
            const settings = await guildSettings.get(message.guild.id);
            
            if (settings.levelingEnabled === false) return;
            
            const userData = await users.get(message.guild.id, message.author.id);
            const now = Date.now();
            
            const totalMessages = (userData.totalMessages || 0) + 1;
            
            if (now - (userData.lastXpTime || 0) < config.leveling.xpCooldown) {
                await users.update(message.guild.id, message.author.id, { totalMessages });
                return;
            }
            
            const baseXp = randomInt(config.leveling.xpPerMessage.min, config.leveling.xpPerMessage.max);
            const oldLevel = userData.level || 0;
            let newXp = (userData.xp || 0) + baseXp;
            let newLevel = oldLevel;
            
            let totalXpNeeded = 0;
            for (let i = 0; i < newLevel; i++) {
                totalXpNeeded += calculateXpForLevel(i);
            }
            
            while (newXp >= totalXpNeeded + calculateXpForLevel(newLevel)) {
                totalXpNeeded += calculateXpForLevel(newLevel);
                newLevel++;
            }
            
            const updates = {
                xp: newXp,
                level: newLevel,
                lastXpTime: now,
                totalMessages
            };
            
            if (newLevel > oldLevel) {
                const coinsReward = config.leveling.coinsPerLevelUp * newLevel;
                updates.coins = (userData.coins || 0) + coinsReward;
                
                const { transactions } = require('../utils/database');
                await transactions.add(message.guild.id, message.author.id, message.author.id, coinsReward, 'level-up', `Level ${newLevel} reached`);
                
                const embed = successEmbed(
                    `**${message.author.username}** leveled up to **Level ${newLevel}**!\n` +
                    `You earned **${coinsReward} coins** as a reward!`
                );
                
                message.channel.send({ embeds: [embed] }).catch(() => {});
            }
            
            await users.update(message.guild.id, message.author.id, updates);
        } catch (error) {
            console.error('Error in leveling handler:', error.message);
        }
    },
    
    async checkMail(message) {
        try {
            const unreadCount = await mail.getUnreadCount(message.guild.id, message.author.id);
            if (unreadCount > 0 && Math.random() < 0.1) {
                const dm = await message.author.createDM().catch(() => null);
                if (dm) {
                    await dm.send(`${emoji.mail} You have **${unreadCount}** unread mail messages! Use \`/inbox\` to check them.`).catch(() => {});
                }
            }
        } catch (error) {
        }
    }
};