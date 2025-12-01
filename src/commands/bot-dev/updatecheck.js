const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed, errorEmbed } = require('../../utils/helpers');
const emoji = require('../../utils/emoji');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updatecheck')
        .setDescription('Check if code updates are needed (Bot Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            const commandsDir = path.join(__dirname, '..', '..', 'commands');
            let commandCount = 0;
            let fileCount = 0;
            let hasIssues = [];
            
            const scanDirectory = (dir) => {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory()) {
                        scanDirectory(filePath);
                    } else if (file.endsWith('.js')) {
                        fileCount++;
                        const content = fs.readFileSync(filePath, 'utf8');
                        
                        if (!content.includes('try {') || !content.includes('} catch')) {
                            hasIssues.push(`${emoji.warning} Missing error handling: ${file}`);
                        }
                        if (!content.includes('SlashCommandBuilder')) {
                            hasIssues.push(`${emoji.warning} Not a command: ${file}`);
                        } else {
                            commandCount++;
                        }
                    }
                }
            };
            
            scanDirectory(commandsDir);
            
            const status = hasIssues.length === 0 ? 'HEALTHY' : 'NEEDS FIXES';
            const color = hasIssues.length === 0 ? 0x00ff00 : 0xff9900;
            
            const embed = createEmbed({
                title: `${emoji.search} Bot Update Check`,
                description: `Status: **${status}**`,
                color,
                fields: [
                    { name: 'Total Commands', value: String(commandCount), inline: true },
                    { name: 'Total Files', value: String(fileCount), inline: true },
                    { name: 'Issues Found', value: String(hasIssues.length), inline: true },
                    { 
                        name: 'Details', 
                        value: hasIssues.length > 0 ? hasIssues.slice(0, 5).join('\n') : `All systems operational ${emoji.success}`,
                        inline: false 
                    }
                ],
                footer: 'Run this command regularly to ensure bot health'
            });
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in updatecheck command:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Error performing update check.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
