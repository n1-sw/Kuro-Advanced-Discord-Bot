const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the bot invite link and support info'),
    
    async execute(interaction) {
        try {
            const clientId = interaction.client.user.id;
            const botName = interaction.client.user.username;
            const inviteLink = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.rocket} Invite ${botName} to Your Server`)
                .setDescription(`
${emoji.sparkles} **The Ultimate Discord Bot Experience**

Add ${botName} to your server and unlock amazing features:

${emoji.shield} **Advanced Moderation** - Ban, kick, mute, warn, and more
${emoji.leveling} **Leveling System** - Track member activity and progression
${emoji.economy} **Economy System** - Coins, shop, and trading
${emoji.games} **Mini-Games** - Coinflip, dice, slots, gambles
${emoji.mail} **Mail System** - Private messaging between members
${emoji.admin} **Server Management** - Welcome messages, auto-reactions, and more
${emoji.zap} **Auto-Moderation** - Spam detection, bad word filtering, anti-nuke protection

${emoji.star} **24/7 Uptime** - Always online and ready to serve
${emoji.star} **42 Slash Commands** - Easy to use and powerful
${emoji.star} **Free & Open** - No premium features required
            `)
                .setColor(0x5865F2)
                .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
                .addFields(
                    {
                        name: `${emoji.shield} Required Permissions`,
                        value: '`Administrator`\n\nThis allows the bot to manage all server features including moderation, roles, and channels.',
                        inline: false
                    },
                    {
                        name: `${emoji.info} Bot Stats`,
                        value: `**Servers:** ${interaction.client.guilds.cache.size}\n**Users:** ${interaction.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: `${emoji.settings} Commands`,
                        value: `**Total:** 42 slash commands\n**Categories:** 7`,
                        inline: true
                    }
                )
                .setFooter({ text: `${botName} • Click the buttons below to get started`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            
            const inviteButton = new ButtonBuilder()
                .setLabel('📨 Invite Bot')
                .setStyle(ButtonStyle.Link)
                .setURL(inviteLink)
                .setEmoji('📨');
            
            const supportButton = new ButtonBuilder()
                .setLabel('💬 Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/aufQqEJSEu')
                .setEmoji('💬');
            
            const helpButton = new ButtonBuilder()
                .setLabel('📖 View Commands')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📖')
                .setCustomId('view_commands_help');
            
            const row1 = new ActionRowBuilder().addComponents(inviteButton, supportButton);
            const row2 = new ActionRowBuilder().addComponents(helpButton);
            
            await interaction.reply({ embeds: [embed], components: [row1, row2] });
        } catch (error) {
            console.error('Invite command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: `${emoji.error} Error getting invite link.`, flags: 64 }).catch(() => {});
            }
        }
    }
};
