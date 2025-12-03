const { SlashCommandBuilder } = require('discord.js');
const { formatNumber } = require('../../utils/helpers');
const { users } = require('../../utils/database');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your coin balance')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check')
                .setRequired(false)),
    
    async execute(interaction) {
        try {
            const target = interaction.options.getMember('user') || interaction.member;
            const userData = users.get(interaction.guild.id, target.id) || { coins: 0, level: 0, inventory: [], dailyStreak: 0, totalMessages: 0 };
            
            const guildUsers = Object.entries(users.data || {})
                .filter(([key]) => key.startsWith(interaction.guild.id))
                .map(([, data]) => data) || [];
            const coinRank = guildUsers.length > 0 ? [...guildUsers].sort((a, b) => (b.coins || 0) - (a.coins || 0)).findIndex(u => u.userId === target.id) + 1 : 1;
            
            const statusEmoji = (userData.coins || 0) >= 1000 ? emoji.money_bag : (userData.coins || 0) >= 500 ? emoji.trophy : emoji.coin;
            const statusText = (userData.coins || 0) >= 1000 ? 'Rich' : (userData.coins || 0) >= 500 ? 'Wealthy' : 'Growing';
            
            const embed = AdvancedEmbed.economy?.(`Wallet Status`, 
                `💰 **${formatNumber(userData.coins || 0)}** coins\n📊 **Rank #${coinRank}** | **Level ${userData.level || 0}**\n${statusEmoji} Status: **${statusText}**`,
                [
                    { name: `${emoji.diamond} Total Coins`, value: `\`${formatNumber(userData.coins || 0)}\``, inline: true },
                    { name: `${emoji.chart} Ranking`, value: `\`#${coinRank}\``, inline: true },
                    { name: `${emoji.gift} Inventory`, value: `\`${(userData.inventory?.length || 0)} items\``, inline: true },
                    { name: `${emoji.trophy} Level`, value: `\`${userData.level || 0}\``, inline: true },
                    { name: `${emoji.fire} Streak`, value: `\`${userData.dailyStreak || 0}\``, inline: true },
                    { name: `${emoji.messages} Messages`, value: `\`${userData.totalMessages || 0}\``, inline: true }
                ],
                target.user?.displayAvatarURL?.({ size: 256 })
            ) || new (require('discord.js').EmbedBuilder)().setTitle('💰 Wallet Status').setDescription(`**${formatNumber(userData.coins || 0)}** coins`);
            
            await interaction.reply({ embeds: [embed] }).catch(() => {
                interaction.reply({ content: `💰 Balance: **${formatNumber(userData.coins || 0)}** coins | Rank: #${coinRank}` });
            });
        } catch (error) {
            console.error(`[balance.js]`, error.message);
            const embed = AdvancedEmbed.commandError?.('Balance Check Failed', error.message || 'Could not retrieve your wallet information') || new (require('discord.js').EmbedBuilder)().setTitle('Error').setDescription('Failed to check balance');
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {
                    interaction.reply({ content: '❌ Error checking balance', flags: 64 });
                });
            }
        }
    }
};
