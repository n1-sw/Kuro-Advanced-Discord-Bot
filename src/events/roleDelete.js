const { antiNukeTracking } = require('../utils/database');
const config = require('../config');

module.exports = {
    name: 'roleDelete',
    
    async execute(role, client) {
        if (!config.antinuke.enabled) return;
        
        try {
            if (!role || !role.guild) return;
            
            const fetchedLogs = await role.guild.fetchAuditLogs({
                limit: 1,
                type: 32
            }).catch(() => null);
            
            if (!fetchedLogs) return;
            
            const deleteLog = fetchedLogs.entries.first();
            if (!deleteLog) return;
            
            const { executor } = deleteLog;
            if (!executor || executor.id === client.user.id) return;
            
            const deleteCount = antiNukeTracking.track(role.guild.id, executor.id, 'roleDelete');
            
            if (deleteCount >= config.antinuke.maxRoleDeletesPerMinute) {
                const executorMember = await role.guild.members.fetch(executor.id).catch(() => null);
                
                if (executorMember && executorMember.bannable) {
                    await executorMember.ban({ reason: 'Anti-nuke: Mass role deletion detected' });
                    console.log(`✅ Anti-nuke: Banned ${executor.tag} for mass role deletion`);
                }
            }
        } catch (error) {
            if (error.code !== 10004) {
                console.error('Error in role delete detection:', error.message);
            }
        }
    }
};
