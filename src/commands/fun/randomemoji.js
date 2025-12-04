const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomemoji')
        .setDescription('Get random emojis from servers the bot is in')
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Number of emojis to get (1-10)')
                .setMinValue(1)
                .setMaxValue(10))
        .addBooleanOption(option =>
            option.setName('animated')
                .setDescription('Only show animated emojis'))
        .addBooleanOption(option =>
            option.setName('other_servers')
                .setDescription('Prefer emojis from other servers')),
    
    async execute(interaction) {
        try {
            const count = interaction.options.getInteger('count') || 5;
            const animatedOnly = interaction.options.getBoolean('animated');
            const preferOtherServers = interaction.options.getBoolean('other_servers') ?? true;
            
            const client = interaction.client;
            
            if (!client.emojiManager) {
                const EmojiManager = require('../../utils/emojiManager');
                client.emojiManager = new EmojiManager(client);
            }
            
            const emojis = await client.emojiManager.getRandomEmojis(count, {
                animated: animatedOnly || null,
                excludeGuildId: interaction.guildId,
                preferOtherServers: preferOtherServers
            });
            
            if (emojis.length === 0) {
                return interaction.reply({
                    content: `${emoji.warning} No emojis found! The bot needs to be in servers with custom emojis.`,
                    flags: 64
                });
            }
            
            const stats = client.emojiManager.getStats();
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.sparkles} Random Emojis`)
                .setDescription(emojis.join(' '))
                .setColor(emoji.color_fun)
                .addFields(
                    { 
                        name: `${emoji.chart} Emoji Pool`, 
                        value: `\`${stats.totalEmojis}\` emojis from \`${stats.serverCount}\` servers`, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Requested by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] randomemoji.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to get random emojis.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
