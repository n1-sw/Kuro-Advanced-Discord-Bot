const { users, spamTracking, mail } = require('../utils/database');
const { successEmbed, calculateXpForLevel, randomInt } = require('../utils/helpers');
const config = require('../config');

module.exports = {
    name: 'messageCreate',
    
    async execute(message, client) {
        if (!message.guild) return;
        
        await this.handleAutoMod(message, client);
        await this.handleLeveling(message);
        await this.checkMail(message);
    },
    
    async handleAutoMod(message, client) {
        if (!config.automod.enabled) return;
        if (message.member.permissions.has('Administrator')) return;
        
        if (spamTracking.isSpamming(message.guild.id, message.author.id)) {
            try {
                await message.delete();
                const warning = await message.channel.send(`${message.author}, please stop spamming!`);
                setTimeout(() => warning.delete().catch(() => {}), 5000);
                
                const userData = users.get(message.guild.id, message.author.id);
                userData.warnings.push({
                    reason: 'Spamming',
                    moderator: client.user.id,
                    timestamp: Date.now()
                });
                users.save();
                
                if (userData.warnings.length >= config.automod.muteThreshold) {
                    const member = message.member;
                    if (member.moderatable) {
                        await member.timeout(10 * 60 * 1000, 'Auto-mod: Excessive warnings');
                    }
                }
            } catch (error) {
                console.error('Auto-mod spam error:', error);
                if (client.webhookLogger && client.webhookLogger.enabled) {
                    await client.webhookLogger.sendError('Auto-Mod Spam Error', error.message, {
                        userId: message.author.id,
                        guildId: message.guild.id,
                        stack: error.stack
                    });
                }
            }
            return;
        }
        
        const content = message.content.toLowerCase();
        const hasBadWord = config.automod.badWords.some(word => content.includes(word.toLowerCase()));
        
        if (hasBadWord) {
            try {
                await message.delete();
                const warning = await message.channel.send(`${message.author}, please watch your language!`);
                setTimeout(() => warning.delete().catch(() => {}), 5000);
            } catch (error) {
                console.error('Auto-mod bad word error:', error);
            }
            return;
        }
        
        const mentionCount = message.mentions.users.size + message.mentions.roles.size;
        if (mentionCount > config.automod.maxMentions) {
            try {
                await message.delete();
                const warning = await message.channel.send(`${message.author}, too many mentions!`);
                setTimeout(() => warning.delete().catch(() => {}), 5000);
            } catch (error) {
                console.error('Auto-mod mentions error:', error);
            }
        }
    },
    
    async handleLeveling(message) {
        const userData = users.get(message.guild.id, message.author.id);
        const now = Date.now();
        
        userData.userId = message.author.id;
        userData.guildId = message.guild.id;
        userData.totalMessages++;
        
        if (now - userData.lastXpTime < config.leveling.xpCooldown) {
            users.save();
            return;
        }
        
        const xpGain = randomInt(config.leveling.xpPerMessage.min, config.leveling.xpPerMessage.max);
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
            
            const embed = successEmbed(
                `**${message.author.username}** leveled up to **Level ${userData.level}**!\n` +
                `You earned **${coinsReward} coins** as a reward!`
            );
            
            message.channel.send({ embeds: [embed] }).catch(() => {});
        }
        
        users.save();
    },
    
    async checkMail(message) {
        const unreadCount = mail.getUnreadCount(message.guild.id, message.author.id);
        
        if (unreadCount > 0 && Math.random() < 0.1) {
            message.author.send(`You have ${unreadCount} unread mail(s)! Use \`${config.prefix}inbox\` to check.`).catch(() => {});
        }
    }
};
