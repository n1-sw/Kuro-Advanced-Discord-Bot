const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emoji = require('./emoji');

let lastRefreshTime = null;
let refreshCount = 0;

async function getCommands() {
    const commands = [];
    
    try {
        const commandsPath = path.join(__dirname, '../commands');
        if (!fs.existsSync(commandsPath)) {
            console.error(`Commands directory not found: ${commandsPath}`);
            return commands;
        }
        
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            
            try {
                const stat = fs.statSync(folderPath);
                if (!stat.isDirectory()) continue;

                const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

                for (const file of commandFiles) {
                    try {
                        // Clear require cache to get fresh version
                        delete require.cache[path.resolve(path.join(folderPath, file))];
                        const command = require(path.join(folderPath, file));
                        
                        if (command.data && command.data.toJSON) {
                            commands.push(command.data.toJSON());
                        }
                    } catch (e) {
                        console.error(`Error loading command ${file} in ${folder}:`, e.message);
                    }
                }
            } catch (e) {
                console.error(`Error reading folder ${folder}:`, e.message);
            }
        }
    } catch (e) {
        console.error('Error in getCommands:', e.message);
    }

    return commands;
}

async function autoDeployCommands(token, clientId, options = {}) {
    if (!token || !clientId) {
        console.log('⏭️ Auto-deploy skipped: Missing DISCORD_BOT_TOKEN or CLIENT_ID');
        return false;
    }

    const silent = options.silent || false;
    const webhookLogger = options.webhookLogger;

    if (!silent) {
        console.log(`\n${emoji.refresh} AUTO-DEPLOY: Syncing commands with Discord...`);
    }

    try {
        const commands = await getCommands();
        
        if (commands.length === 0) {
            console.error('❌ AUTO-DEPLOY FAILED: No commands found to deploy');
            if (webhookLogger && webhookLogger.enabled) {
                await webhookLogger.sendError('Auto-Deploy Failed', 'No commands found to deploy');
            }
            return false;
        }
        
        const rest = new REST({ version: '10' }).setToken(token);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        if (!silent) {
            console.log(`✅ AUTO-DEPLOY SUCCESS: ${data.length} commands synced with Discord`);
            data.forEach(cmd => console.log(`   ├─ /${cmd.name}`));
        }
        
        lastRefreshTime = new Date();
        refreshCount++;
        
        return true;
    } catch (error) {
        const errorMsg = error?.message || 'Unknown error';
        const errorCode = error?.code || 'NO_CODE';
        console.error(`❌ AUTO-DEPLOY FAILED: ${errorMsg}`);
        if (errorCode && errorCode !== 'NO_CODE') console.error(`   Error code: ${errorCode}`);
        
        if (webhookLogger && webhookLogger.enabled) {
            await webhookLogger.sendError('Auto-Deploy Failed', errorMsg, {
                errorCode: errorCode,
                stack: error?.stack
            });
        }
        return false;
    }
}

async function startAutoRefreshSchedule(client, token, clientId, intervalMs = 3600000) {
    if (!token || !clientId) {
        console.log('⏭️ Auto-refresh schedule skipped: Missing credentials');
        return null;
    }

    const minutes = Math.floor(intervalMs / 60000);
    console.log(`✅ AUTO-REFRESH: Scheduled to sync every ${minutes} minute(s)`);

    const intervalId = setInterval(async () => {
        console.log(`${emoji.refresh} AUTO-REFRESH: Running command sync...`);
        try {
            const commands = await getCommands();
            
            if (commands.length === 0) {
                console.error('❌ AUTO-REFRESH: No commands found');
                if (client.webhookLogger && client.webhookLogger.enabled) {
                    await client.webhookLogger.sendError('Auto-Refresh Failed', 'No commands found during auto-refresh sync');
                }
                return;
            }

            const rest = new REST({ version: '10' }).setToken(token);
            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );

            console.log(`✅ AUTO-REFRESH: ${data.length} commands synced successfully`);
        } catch (e) {
            console.error('AUTO-REFRESH: Error during sync:', e.message);
            if (client.webhookLogger && client.webhookLogger.enabled) {
                await client.webhookLogger.sendError('Auto-Refresh Error', e.message, {
                    errorCode: e.code || 'AUTO_REFRESH_ERROR',
                    stack: e.stack
                });
            }
        }
    }, intervalMs);

    return intervalId;
}

function stopAutoRefreshSchedule(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
        console.log('⏹️ AUTO-REFRESH: Schedule stopped');
        return true;
    }
    return false;
}

function getAutoRefreshStatus() {
    const config = require('../config');
    const enabled = Boolean(config?.autoDeploy?.enabled ?? true);
    const intervalMs = config?.autoDeploy?.refreshIntervalMs ?? 3600000;
    const intervalMinutes = Math.floor(intervalMs / 60000);

    return {
        enabled,
        interval: intervalMinutes,
        lastRefresh: lastRefreshTime,
        totalRefreshes: refreshCount,
        nextRefreshIn: lastRefreshTime ? 'Check auto-refresh schedule' : 'Not yet synced'
    };
}

module.exports = {
    autoDeployCommands,
    startAutoRefreshSchedule,
    stopAutoRefreshSchedule,
    getCommands,
    getAutoRefreshStatus
};
