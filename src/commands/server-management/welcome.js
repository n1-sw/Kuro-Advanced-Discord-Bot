const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');
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
            console.error(`[Command Error] welcome.js:`, error.message);}
    return {};
};

const saveWelcomeConfig = (config) => {
    try {
        fs.mkdirSync(path.dirname(configFile), { recursive: true });
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    } catch (error) {
            console.error(`[Command Error] welcome.js:`, error.message);}
};

const defaultWelcomeMessage = 'Welcome {user} to **{server}**! We now have {membercount} members!';
const defaultLeaveMessage = 'Goodbye {user}! We now have {membercount} members remaining.';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Manage welcome and leave messages')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Set custom welcome or leave message')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Message type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome Message', value: 'welcome' },
                            { name: 'Leave Message', value: 'leave' }
                        ))
                .addStringOption(opt =>
                    opt.setName('message')
                        .setDescription('Custom message (use {user}, {server}, {membercount})')
                        .setRequired(true)
                        .setMaxLength(500)))
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Set welcome or leave channel')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Channel type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome Channel', value: 'welcome' },
                            { name: 'Leave Channel', value: 'leave' }
                        ))
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('Channel to send messages')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub =>
            sub.setName('toggle')
                .setDescription('Enable or disable welcome/leave messages')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Feature to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome Messages', value: 'welcome' },
                            { name: 'Leave Messages', value: 'leave' }
                        )))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View current welcome and leave settings'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        try {
            const config = loadWelcomeConfig();
            const guildId = interaction.guild.id;
            const subcommand = interaction.options.getSubcommand();
            
            if (!config[guildId]) {
                config[guildId] = {
                    welcome: { enabled: false, message: defaultWelcomeMessage, channelId: null },
                    leave: { enabled: false, message: defaultLeaveMessage, channelId: null }
                };
            }

            if (subcommand === 'set') {
                const type = interaction.options.getString('type');
                const message = interaction.options.getString('message');
                
                config[guildId][type] = config[guildId][type] || { enabled: false, channelId: null };
                config[guildId][type].message = message;
                saveWelcomeConfig(config);
                
                const embed = AdvancedEmbed.commandSuccess(`${type === 'welcome' ? 'Welcome' : 'Leave'} Message Updated`, message);
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'channel') {
                const type = interaction.options.getString('type');
                const channel = interaction.options.getChannel('channel');
                
                config[guildId][type] = config[guildId][type] || { enabled: false, message: type === 'welcome' ? defaultWelcomeMessage : defaultLeaveMessage };
                config[guildId][type].channelId = channel.id;
                saveWelcomeConfig(config);
                
                const embed = AdvancedEmbed.commandSuccess(`Channel Updated`, `${type === 'welcome' ? 'Welcome' : 'Leave'} channel set to ${channel}`);
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'toggle') {
                const type = interaction.options.getString('type');
                
                if (!config[guildId][type]) {
                    config[guildId][type] = { enabled: false, message: type === 'welcome' ? defaultWelcomeMessage : defaultLeaveMessage, channelId: null };
                }
                
                config[guildId][type].enabled = !config[guildId][type].enabled;
                saveWelcomeConfig(config);
                
                const embed = AdvancedEmbed.commandSuccess(
                    `${type === 'welcome' ? 'Welcome' : 'Leave'} Messages`,
                    config[guildId][type].enabled ? '✅ Enabled' : '❌ Disabled'
                );
                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'view') {
                const welcome = config[guildId].welcome || { enabled: false, channelId: null, message: defaultWelcomeMessage };
                const leave = config[guildId].leave || { enabled: false, channelId: null, message: defaultLeaveMessage };
                
                const embed = AdvancedEmbed.info('Welcome System Settings', 'Current configuration', [
                    { name: 'Welcome Status', value: welcome.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: 'Welcome Channel', value: welcome.channelId ? `<#${welcome.channelId}>` : 'Not set', inline: true },
                    { name: 'Leave Status', value: leave.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: 'Leave Channel', value: leave.channelId ? `<#${leave.channelId}>` : 'Not set', inline: true },
                    { name: 'Welcome Message', value: `\`${welcome.message}\``, inline: false },
                    { name: 'Leave Message', value: `\`${leave.message}\``, inline: false }
                ]);
                return interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(`[Command Error] welcome.js:`, error.message);
            const embed = AdvancedEmbed.commandError('Welcome System Error', 'Could not process command');
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {});
            }
        }
    }
};
