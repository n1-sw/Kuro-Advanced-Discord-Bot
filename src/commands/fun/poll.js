const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll for users to vote on')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('First option')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Second option')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Third option (optional)'))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Fourth option (optional)'))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Poll duration in minutes (default: 5, max: 60)')
                .setMinValue(1)
                .setMaxValue(60)),
    
    async execute(interaction) {
        try {
            const question = interaction.options.getString('question');
            const duration = (interaction.options.getInteger('duration') || 5) * 60000;
            
            const options = [
                interaction.options.getString('option1'),
                interaction.options.getString('option2'),
                interaction.options.getString('option3'),
                interaction.options.getString('option4')
            ].filter(Boolean);
            
            const votes = {};
            const voters = {};
            options.forEach((_, i) => {
                votes[i] = 0;
                voters[i] = [];
            });
            
            const optionEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
            
            const buttons = options.map((opt, i) => 
                new ButtonBuilder()
                    .setCustomId(`poll_${i}`)
                    .setLabel(opt.substring(0, 80))
                    .setEmoji(optionEmojis[i])
                    .setStyle(ButtonStyle.Primary)
            );
            
            const row = new ActionRowBuilder().addComponents(buttons);
            
            const buildEmbed = (final = false) => {
                const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
                
                const optionsText = options.map((opt, i) => {
                    const count = votes[i];
                    const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const bar = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));
                    return `${optionEmojis[i]} **${opt}**\n${bar} ${percent}% (${count} votes)`;
                }).join('\n\n');
                
                const embed = new EmbedBuilder()
                    .setTitle(`${emoji.chart} ${final ? 'Poll Results' : 'Poll'}`)
                    .setDescription(`**${question}**\n\n${optionsText}`)
                    .setColor(final ? emoji.color_success : emoji.color_info)
                    .addFields({ 
                        name: `${emoji.people} Total Votes`, 
                        value: `\`${totalVotes}\``, 
                        inline: true 
                    })
                    .setFooter({ 
                        text: final 
                            ? `Poll ended • Created by ${interaction.user.username}` 
                            : `Ends ${Math.round(duration / 60000)} min after creation • Created by ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                return embed;
            };
            
            const response = await interaction.reply({ 
                embeds: [buildEmbed()], 
                components: [row], 
                fetchReply: true 
            });
            
            const collector = response.createMessageComponentCollector({ time: duration });
            
            collector.on('collect', async (buttonInteraction) => {
                const optionIndex = parseInt(buttonInteraction.customId.replace('poll_', ''));
                const odId = buttonInteraction.user.id;
                
                for (let i = 0; i < options.length; i++) {
                    const voterIndex = voters[i].indexOf(odId);
                    if (voterIndex !== -1) {
                        voters[i].splice(voterIndex, 1);
                        votes[i]--;
                    }
                }
                
                voters[optionIndex].push(odId);
                votes[optionIndex]++;
                
                await buttonInteraction.update({ embeds: [buildEmbed()] });
            });
            
            collector.on('end', async () => {
                buttons.forEach(btn => btn.setDisabled(true));
                const disabledRow = new ActionRowBuilder().addComponents(buttons);
                
                await response.edit({ 
                    embeds: [buildEmbed(true)], 
                    components: [disabledRow] 
                }).catch(() => {});
            });
        } catch (error) {
            console.error(`[Command Error] poll.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to create poll.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
