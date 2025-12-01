const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/helpers');
const emoji = require('../../utils/emoji');
const fs = require('fs');
const path = require('path');

const configFile = path.join(__dirname, '../../data/welcome.json');

const loadWelcomeConfig = () => {
    try {
        if (!fs.existsSync(path.dirname(configFile))) {
            fs.mkdirSync(path.dirname(configFile), { recursive: true });
        }
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading welcome config:', error);
    }
    return {};
};

const saveWelcomeConfig = (config) => {
    try {
        fs.mkdirSync(path.dirname(configFile), { recursive: true });
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving welcome config:', error);
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Manage welcome/leave messages (guild-only)')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Set welcome/leave messages')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Message type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome', value: 'welcome' },
                            { name: 'Leave', value: 'leave' }
                        ))
                .addStringOption(opt =>
                    opt.setName('message')
                        .setDescription('Message text (use {user} and {server} for placeholders)')
                        .setRequired(true)
                        .setMaxLength(200)))
        .addSubcommand(sub =>
            sub.setName('toggle')
                .setDescription('Enable/disable auto messages')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Message type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome', value: 'welcome' },
                            { name: 'Leave', value: 'leave' }
                        )))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View current welcome/leave settings'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const config = loadWelcomeConfig();
            const guildId = interaction.guild.id;
            const subcommand = interaction.options.getSubcommand();
            
            if (!config[guildId]) {
                config[guildId] = { welcome: { enabled: false, message: '' }, leave: { enabled: false, message: '' } };
            }
            
            if (subcommand === 'set') {
                const type = interaction.options.getString('type');
                const message = interaction.options.getString('message');
                
                config[guildId][type] = { enabled: true, message };
                saveWelcomeConfig(config);
                
                await interaction.reply({
                    embeds: [successEmbed(`${type.charAt(0).toUpperCase() + type.slice(1)} message set!\n\n**Preview:**\n${message.replace('{user}', interaction.user.username).replace('{server}', interaction.guild.name)}`)],
                    flags: 64
                });
            } else if (subcommand === 'toggle') {
                const type = interaction.options.getString('type');
                config[guildId][type].enabled = !config[guildId][type].enabled;
                saveWelcomeConfig(config);
                
                const status = config[guildId][type].enabled ? 'enabled' : 'disabled';
                await interaction.reply({
                    embeds: [successEmbed(`${type.charAt(0).toUpperCase() + type.slice(1)} messages **${status}**!`)],
                    flags: 64
                });
            } else if (subcommand === 'view') {
                const embed = createEmbed({
                    title: 'Welcome/Leave Settings',
                    fields: [
                        { name: 'Welcome', value: config[guildId].welcome.enabled ? `${emoji.success} ${config[guildId].welcome.message}` : `${emoji.error} Disabled`, inline: false },
                        { name: 'Leave', value: config[guildId].leave.enabled ? `${emoji.success} ${config[guildId].leave.message}` : `${emoji.error} Disabled`, inline: false }
                    ],
                    color: 0x0099ff
                });
                
                await interaction.reply({ embeds: [embed], flags: 64 });
            }
        } catch (error) {
            console.error('Error in welcome command:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error managing welcome settings.')],
                flags: 64
            }).catch(() => {});
        }
    }
};
