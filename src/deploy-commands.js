require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

for (const folder of commandFolders) {
    const folderPath = path.join(__dirname, 'commands', folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(path.join(folderPath, file));
        if (command.data) {
            console.log(`Loading command: ${command.data.name}`);
            commands.push(command.data.toJSON());
        }
    }
}

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

console.log(`Token exists: ${!!token}`);
console.log(`Client ID: ${clientId}`);
console.log(`Total commands to deploy: ${commands.length}`);

if (!token || !clientId) {
    console.error('Error: Missing DISCORD_BOT_TOKEN or CLIENT_ID in environment variables');
    console.error(`Token: ${token ? 'SET' : 'NOT SET'}`);
    console.error(`Client ID: ${clientId ? 'SET' : 'NOT SET'}`);
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`\nStarting deployment of ${commands.length} slash commands...`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`\nSuccessfully deployed ${data.length} slash commands!`);
        console.log('Commands deployed:');
        data.forEach(cmd => console.log(`  - /${cmd.name}`));
    } catch (error) {
        console.error('\nDeployment failed:');
        console.error(error.message);
        if (error.code) console.error(`Error code: ${error.code}`);
        process.exit(1);
    }
})();
