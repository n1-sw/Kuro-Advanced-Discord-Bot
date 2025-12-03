const { users, spamTracking, mail } = require('../utils/database');
const { successEmbed, calculateXpForLevel, randomInt } = require('../utils/helpers');
const config = require('../config');
const emoji = require('../utils/emoji');
const fs = require('fs');
const path = require('path');

const autoReactConfigFile = path.join(__dirname, '../data/autoreact.json');

const loadAutoReactConfig = () => {
    try {
        if (fs.existsSync(autoReactConfigFile)) {
            return JSON.parse(fs.readFileSync(autoReactConfigFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading autoreact config:', error);
    }
    return {};
};

module.exports = {
    name: 'messageCreate',
    
    async execute(message, client) {
        if (!message.guild) return;
        
        await this.handleAutoMod(message, client);
        await this.handleAutoReactions(message);
        await this.handleLeveling(message);
        await this.checkMail(message);
    },
    
    async handleAutoReactions(message) {
        if (message.author.bot) return;
        if (!message.content) return;
        
        try {
            const config = loadAutoReactConfig();
            const guildConfig = config[message.guild.id];
            
            if (!guildConfig || guildConfig.enabled === false) return;
            
            const content = message.content.toLowerCase();
            const defaultEmojis = ['😀', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯', '🙌', '👀', '💪', '🤩', '😎', '🥳', '💖', '⭐', '🌟', '💫', '🎯', '🏆'];
            
            // Handle keyword reactions
            if (guildConfig.keywords && Object.keys(guildConfig.keywords).length > 0) {
                for (const [keyword, reactionEmoji] of Object.entries(guildConfig.keywords)) {
                    if (keyword && keyword.length > 0 && content.includes(keyword.toLowerCase())) {
                        try {
                            await message.react(reactionEmoji);
                        } catch (error) {
                            console.error(`Failed to react with ${reactionEmoji}:`, error.message);
                        }
                        break;
                    }
                }
            }
            
            // Handle mention reactions
            if (guildConfig.mentionReactionsEnabled && message.mentions.has(message.client.user.id) === false && message.mentions.users.size > 0) {
                const randomChance = Math.random();
                if (randomChance < 0.7) { // 70% chance to react on mentions
                    const randomEmoji = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
                    try {
                        await message.react(randomEmoji);
                    } catch (error) {
                        console.error(`Failed to react with ${randomEmoji}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error('Error in auto-reactions:', error);
        }
    },
    
    async handleAutoMod(message, client) {
        if (!config.automod.enabled) return;
        if (!message.member) return;
        if (message.member.permissions.has('Administrator')) return;
        if (message.author.bot) return;
        if (!message.content) return;
        
        try {
            const guildId = message.guild.id;
            const userId = message.author.id;
            const content = message.content;
            const lowerContent = content.toLowerCase();
            
            // ===== SPAM DETECTION =====
            if (config.automod.spamDetection?.enabled !== false) {
                if (spamTracking.isSpamming(guildId, userId)) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, please stop spamming!`);
                        setTimeout(() => warning.delete().catch(() => {}), 5000);
                        
                        const userData = users.get(guildId, userId);
                        userData.warnings.push({
                            reason: 'Message Spam',
                            moderator: client.user.id,
                            timestamp: Date.now()
                        });
                        users.save();
                        
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
            
            // ===== BAD WORDS DETECTION =====
            if (config.automod.badWordDetection?.enabled !== false) {
                const hasBadWord = config.automod.badWords.some(word => lowerContent.includes(word.toLowerCase()));
                
                if (hasBadWord) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, please watch your language!`);
                        setTimeout(() => warning.delete().catch(() => {}), 5000);
                        
                        const userData = users.get(guildId, userId);
                        userData.warnings.push({
                            reason: 'Profanity',
                            moderator: client.user.id,
                            timestamp: Date.now()
                        });
                        users.save();
                        
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
            
            // ===== MENTION SPAM =====
            const mentionCount = message.mentions.users.size + message.mentions.roles.size;
            if (mentionCount > config.automod.maxMentions) {
                try {
                    await message.delete();
                    const warning = await message.channel.send(`${emoji.warning} ${message.author}, too many mentions!`);
                    setTimeout(() => warning.delete().catch(() => {}), 5000);
                    
                    const userData = users.get(guildId, userId);
                    userData.warnings.push({
                        reason: 'Mention Spam',
                        moderator: client.user.id,
                        timestamp: Date.now()
                    });
                    users.save();
                    
                    console.log(`${emoji.warning} Mention spam from ${message.author.tag} (${mentionCount} mentions)`);
                } catch (error) {
                    console.error('AutoMod mentions error:', error.message);
                }
                return;
            }
            
            // ===== CAPS SPAM DETECTION =====
            if (config.automod.capsDetection?.enabled && content.length > 10) {
                const capsCount = (content.match(/[A-Z]/g) || []).length;
                const capsPercentage = (capsCount / content.length) * 100;
                const threshold = config.automod.capsDetection?.threshold || 70;
                
                if (capsPercentage > threshold) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, no excessive caps!`);
                        setTimeout(() => warning.delete().catch(() => {}), 3000);
                        console.log(`${emoji.warning} Caps spam from ${message.author.tag} (${Math.round(capsPercentage)}%)`);
                    } catch (error) {
                        console.error('AutoMod caps detection error:', error.message);
                    }
                    return;
                }
            }
            
            // ===== REPEATED CHARACTER SPAM =====
            if (config.automod.repeatDetection?.enabled) {
                const repeatRegex = /(.)\1{5,}/g;
                if (repeatRegex.test(content)) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, no character spam!`);
                        setTimeout(() => warning.delete().catch(() => {}), 3000);
                        console.log(`${emoji.warning} Character repeat spam from ${message.author.tag}`);
                    } catch (error) {
                        console.error('AutoMod repeat detection error:', error.message);
                    }
                    return;
                }
            }
            
            // ===== INVITE/LINK DETECTION =====
            if (config.automod.linkDetection?.enabled && !message.member.permissions.has('ManageMessages')) {
                const discordInviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/gi;
                const linkRegex = /(https?:\/\/[^\s]+)/gi;
                
                const invites = lowerContent.match(discordInviteRegex);
                if (invites && invites.length > 0) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, no invite links!`);
                        setTimeout(() => warning.delete().catch(() => {}), 3000);
                        console.log(`${emoji.warning} Invite link from ${message.author.tag}`);
                    } catch (error) {
                        console.error('AutoMod invite detection error:', error.message);
                    }
                    return;
                }
            }
            
            // ===== EMOJI SPAM =====
            if (config.automod.emojiDetection?.enabled) {
                const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
                const emojiCount = (content.match(emojiRegex) || []).length;
                
                if (emojiCount > (config.automod.maxEmojis || 10)) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`${emoji.warning} ${message.author}, too many emojis!`);
                        setTimeout(() => warning.delete().catch(() => {}), 3000);
                        console.log(`${emoji.warning} Emoji spam from ${message.author.tag} (${emojiCount} emojis)`);
                    } catch (error) {
                        console.error('AutoMod emoji detection error:', error.message);
                    }
                    return;
                }
            }
            
        } catch (error) {
            console.error('Unexpected error in automod handler:', error);
        }
    },
    
    async handleLeveling(message) {
        try {
            const { guildSettings } = require('../utils/database');
            const settings = guildSettings.get(message.guild.id);
            
            if (!settings.rankingEnabled) return;
            
            const userData = users.get(message.guild.id, message.author.id);
            const now = Date.now();
            
            userData.userId = message.author.id;
            userData.guildId = message.guild.id;
            userData.totalMessages++;
            
            if (now - userData.lastXpTime < config.leveling.xpCooldown) {
                users.save();
                return;
            }
            
            const multiplier = settings.xpMultiplier || 1;
            const baseXp = randomInt(config.leveling.xpPerMessage.min, config.leveling.xpPerMessage.max);
            const xpGain = Math.floor(baseXp * multiplier);
            const oldLevel = userData.level;
            
            userData.xp += xpGain;
            userData.lastXpTime = now;
            
            let totalXpNeeded = 0;
            for (let i = 0; i < userData.level; i++) {
                totalXpNeeded += calculateXpForLevel(i);
            }
            
            while (userData.xp >= totalXpNeeded + calculateXpForLevel(userData.level)) {
                totalXpNeeded += calculateXpForLevel(userData.level);
                userData.level++;
            }
            
            if (userData.level > oldLevel) {
                const coinsReward = config.leveling.coinsPerLevelUp * userData.level;
                userData.coins += coinsReward;
                
                const { transactions } = require('../utils/database');
                transactions.add(message.guild.id, message.author.id, message.author.id, coinsReward, 'level-up', `Level ${userData.level} reached`);
                
                if (settings.announceLevel !== false) {
                    const embed = successEmbed(
                        `**${message.author.username}** leveled up to **Level ${userData.level}**!\n` +
                        `You earned **${coinsReward} coins** as a reward!`
                    );
                    
                    const announceChannel = settings.levelUpChannelId 
                        ? message.guild.channels.cache.get(settings.levelUpChannelId) 
                        : message.channel;
                    
                    if (announceChannel?.isTextBased()) {
                        announceChannel.send({ embeds: [embed] }).catch(() => {});
                    }
                }
            }
            
            users.save();
        } catch (error) {
            console.error('Error in leveling handler:', error);
        }
    },
    
    async checkMail(message) {
        try {
            const unreadCount = mail.getUnreadCount(message.guild.id, message.author.id);
            if (unreadCount > 0) {
                const dm = await message.author.createDM().catch(() => null);
                if (dm) {
                    await dm.send(`${emoji.mail} You have **${unreadCount}** unread mail messages! Use \`/read\` to check them.`).catch(() => {});
                }
            }
        } catch (error) {
            console.error('Error checking mail:', error);
        }
    }
};
