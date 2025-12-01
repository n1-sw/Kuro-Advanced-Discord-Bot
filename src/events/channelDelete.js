const { antiNukeTracking } = require('../utils/database');
const config = require('../config');

module.exports = {
    name: 'channelDelete',
    
    async execute(channel, client) {
        if (!config.antinuke.enabled) return;
        if (!channel.guild) return;
        
        try {
            const fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: 12
            });
            
            const deleteLog = fetchedLogs.entries.first();
            if (!deleteLog) return;
            
            const { executor } = deleteLog;
            if (executor.id === client.user.id) return;
            
            const deleteCount = antiNukeTracking.track(channel.guild.id, executor.id, 'channelDelete');
            
            if (deleteCount >= config.antinuke.maxChannelDeletesPerMinute) {
                const executorMember = await channel.guild.members.fetch(executor.id);
                
                if (executorMember && executorMember.bannable) {
                    await executorMember.ban({ reason: 'Anti-nuke: Mass channel deletion detected' });
                    console.log(`Anti-nuke: Banned ${executor.tag} for mass channel deletion`);
                }
            }
        } catch (error) {
            console.error('Error in channel delete detection:', error);
        }
    }
};
