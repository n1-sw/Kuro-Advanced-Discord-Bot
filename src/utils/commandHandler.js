const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const emoji = require('./emoji');
const { trackCommand, trackMemberHelped, trackTransaction } = require('./rpc');

const loadCommands = (client) => {
    client.commands = new Collection();
    
    const commandFolders = fs.readdirSync(path.join(__dirname, '../commands'));
    
    for (const folder of commandFolders) {
        const folderPath = path.join(__dirname, '../commands', folder);
        
        if (!fs.statSync(folderPath).isDirectory()) continue;
        
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            delete require.cache[require.resolve(path.join(folderPath, file))];
            const command = require(path.join(folderPath, file));
            
            if (command.data && command.data.name) {
                client.commands.set(command.data.name, command);
                console.log(`Loaded slash command: ${command.data.name}`);
            }
        }
    }
    
    console.log(`Total slash commands loaded: ${client.commands.size}`);
};

const reloadCommands = (client) => {
    console.log(`${emoji.refresh} Auto-reloading all commands...`);
    loadCommands(client);
    console.log(`${emoji.success} Commands reloaded!`);
};

const handleInteraction = async (interaction, client) => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    
    try {
        // Track command execution for RPC
        trackCommand();
        
        // Track specific command types
        if (interaction.commandName === 'ban' || interaction.commandName === 'kick' || 
            interaction.commandName === 'mute' || interaction.commandName === 'warn') {
            trackMemberHelped(); // Moderation counts as helping
        }
        
        if (interaction.commandName === 'give' || interaction.commandName === 'buy' || 
            interaction.commandName === 'sell' || interaction.commandName === 'daily') {
            trackTransaction(); // Economy commands
        }
        
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        
        if (client.webhookLogger && client.webhookLogger.enabled) {
            await client.webhookLogger.sendError(
                'Command Execution Error',
                `Command \`/${interaction.commandName}\` failed`,
                {
                    commandName: interaction.commandName,
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    errorCode: error.code,
                    stack: error.stack
                }
            );
        }
        
        try {
            if (interaction.replied) {
                await interaction.followUp({ content: 'There was an error executing this command.', flags: 64 }).catch(() => {});
            } else if (interaction.deferred) {
                await interaction.editReply({ content: 'There was an error executing this command.' }).catch(() => {});
            } else {
                await interaction.reply({ content: 'There was an error executing this command.', flags: 64 }).catch(() => {});
            }
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }
};

module.exports = { loadCommands, reloadCommands, handleInteraction };
