const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

const choices = {
    rock: { emoji: '🪨', beats: 'scissors', name: 'Rock' },
    paper: { emoji: '📄', beats: 'rock', name: 'Paper' },
    scissors: { emoji: '✂️', beats: 'paper', name: 'Scissors' }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play Rock Paper Scissors against the bot'),
    
    async execute(interaction) {
        try {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rps_rock')
                        .setLabel('Rock')
                        .setEmoji('🪨')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('rps_paper')
                        .setLabel('Paper')
                        .setEmoji('📄')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('rps_scissors')
                        .setLabel('Scissors')
                        .setEmoji('✂️')
                        .setStyle(ButtonStyle.Primary)
                );
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.games} Rock Paper Scissors`)
                .setDescription('Choose your weapon!')
                .setColor(emoji.color_fun)
                .setFooter({ text: 'You have 30 seconds to choose' });
            
            const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
            
            const collector = response.createMessageComponentCollector({ time: 30000 });
            
            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return buttonInteraction.reply({ 
                        content: `${emoji.error} This game is for ${interaction.user}!`, 
                        flags: 64 
                    });
                }
                
                const playerChoice = buttonInteraction.customId.replace('rps_', '');
                const botChoiceKey = Object.keys(choices)[Math.floor(Math.random() * 3)];
                const botChoice = choices[botChoiceKey];
                const playerData = choices[playerChoice];
                
                let result, resultColor;
                if (playerChoice === botChoiceKey) {
                    result = "It's a tie!";
                    resultColor = emoji.color_warning;
                } else if (playerData.beats === botChoiceKey) {
                    result = 'You win!';
                    resultColor = emoji.color_success;
                } else {
                    result = 'You lose!';
                    resultColor = emoji.color_error;
                }
                
                const resultEmbed = new EmbedBuilder()
                    .setTitle(`${emoji.games} Rock Paper Scissors - ${result}`)
                    .setDescription(
                        `**Your choice:** ${playerData.emoji} ${playerData.name}\n` +
                        `**Bot's choice:** ${botChoice.emoji} ${botChoice.name}`
                    )
                    .setColor(resultColor)
                    .setFooter({ text: `Played by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();
                
                row.components.forEach(btn => btn.setDisabled(true));
                await buttonInteraction.update({ embeds: [resultEmbed], components: [row] });
                collector.stop();
            });
            
            collector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    row.components.forEach(btn => btn.setDisabled(true));
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle(`${emoji.games} Rock Paper Scissors`)
                        .setDescription(`${emoji.clock} Time's up! You didn't choose.`)
                        .setColor(emoji.color_error);
                    await response.edit({ embeds: [timeoutEmbed], components: [row] }).catch(() => {});
                }
            });
        } catch (error) {
            console.error(`[Command Error] rps.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to start the game.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
