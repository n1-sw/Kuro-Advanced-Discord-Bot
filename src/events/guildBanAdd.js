const { antiNukeTracking } = require('../utils/database');
const config = require('../config');

module.exports = {
    name: 'guildBanAdd',
    
    async execute(ban, client) {
        if (!config.antinuke.enabled) return;
        
        try {
            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: 22
            });
            
            const banLog = fetchedLogs.entries.first();
            if (!banLog) return;
            
            const { executor } = banLog;
            if (executor.id === client.user.id) return;
            
            const banCount = antiNukeTracking.track(ban.guild.id, executor.id, 'ban');
            
            if (banCount >= config.antinuke.maxBansPerMinute) {
                const executorMember = await ban.guild.members.fetch(executor.id);
                
                if (executorMember && executorMember.bannable) {
                    await executorMember.ban({ reason: 'Anti-nuke: Mass ban detected' });
                    console.log(`Anti-nuke: Banned ${executor.tag} for mass banning`);
                    
                    await ban.guild.members.unban(ban.user.id, 'Anti-nuke: Reversing mass ban');
                }
            }
        } catch (error) {
            console.error('Error in ban detection:', error);
        }
    }
};
