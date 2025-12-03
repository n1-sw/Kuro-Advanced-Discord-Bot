const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

const scenarios = [
    { optionA: "Have the ability to fly", optionB: "Have the ability to be invisible" },
    { optionA: "Be able to read minds", optionB: "Be able to see the future" },
    { optionA: "Live 100 years in the past", optionB: "Live 100 years in the future" },
    { optionA: "Have unlimited money", optionB: "Have unlimited time" },
    { optionA: "Be the funniest person in the room", optionB: "Be the smartest person in the room" },
    { optionA: "Never need to sleep", optionB: "Never need to eat" },
    { optionA: "Speak every language fluently", optionB: "Play every instrument masterfully" },
    { optionA: "Have a rewind button for your life", optionB: "Have a pause button for your life" },
    { optionA: "Be famous when alive and forgotten after death", optionB: "Be unknown when alive but famous after death" },
    { optionA: "Live in a world with no internet", optionB: "Live in a world with no air conditioning/heating" },
    { optionA: "Have a personal chef", optionB: "Have a personal chauffeur" },
    { optionA: "Be able to teleport anywhere", optionB: "Be able to stop time" },
    { optionA: "Have super strength", optionB: "Have super speed" },
    { optionA: "Live in a treehouse", optionB: "Live in a houseboat" },
    { optionA: "Be a master of every martial art", optionB: "Be a master of every sport" },
    { optionA: "Have a photographic memory", optionB: "Have an IQ of 200" },
    { optionA: "Always be 10 minutes late", optionB: "Always be 20 minutes early" },
    { optionA: "Be able to talk to animals", optionB: "Be able to talk to plants" },
    { optionA: "Live without music", optionB: "Live without movies" },
    { optionA: "Be a famous actor", optionB: "Be a famous musician" }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wouldyourather')
        .setDescription('Get a Would You Rather question'),
    
    async execute(interaction) {
        try {
            const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('wyr_a')
                        .setLabel('Option A')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('wyr_b')
                        .setLabel('Option B')
                        .setStyle(ButtonStyle.Primary)
                );
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.wouldyourather} Would You Rather...`)
                .setDescription(
                    `**A)** ${scenario.optionA}\n\n` +
                    `**OR**\n\n` +
                    `**B)** ${scenario.optionB}`
                )
                .setColor(emoji.color_fun)
                .setFooter({ text: 'Vote within 60 seconds!' });
            
            const votes = { a: [], b: [] };
            const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
            
            const collector = response.createMessageComponentCollector({ time: 60000 });
            
            collector.on('collect', async (buttonInteraction) => {
                const choice = buttonInteraction.customId === 'wyr_a' ? 'a' : 'b';
                const odId = buttonInteraction.user.id;
                
                votes.a = votes.a.filter(id => id !== odId);
                votes.b = votes.b.filter(id => id !== odId);
                votes[choice].push(odId);
                
                const total = votes.a.length + votes.b.length;
                const percentA = total > 0 ? Math.round((votes.a.length / total) * 100) : 0;
                const percentB = total > 0 ? Math.round((votes.b.length / total) * 100) : 0;
                
                const updatedEmbed = new EmbedBuilder()
                    .setTitle(`${emoji.wouldyourather} Would You Rather...`)
                    .setDescription(
                        `**A)** ${scenario.optionA}\n` +
                        `${emoji.chart} ${percentA}% (${votes.a.length} votes)\n\n` +
                        `**OR**\n\n` +
                        `**B)** ${scenario.optionB}\n` +
                        `${emoji.chart} ${percentB}% (${votes.b.length} votes)`
                    )
                    .setColor(emoji.color_fun)
                    .setFooter({ text: `Total votes: ${total}` });
                
                await buttonInteraction.update({ embeds: [updatedEmbed] });
            });
            
            collector.on('end', async () => {
                row.components.forEach(btn => btn.setDisabled(true));
                
                const total = votes.a.length + votes.b.length;
                const percentA = total > 0 ? Math.round((votes.a.length / total) * 100) : 50;
                const percentB = total > 0 ? Math.round((votes.b.length / total) * 100) : 50;
                
                const winner = votes.a.length > votes.b.length ? 'A' : votes.b.length > votes.a.length ? 'B' : 'Tie';
                
                const finalEmbed = new EmbedBuilder()
                    .setTitle(`${emoji.wouldyourather} Would You Rather - Results`)
                    .setDescription(
                        `**A)** ${scenario.optionA}\n` +
                        `${emoji.chart} ${percentA}% (${votes.a.length} votes)\n\n` +
                        `**OR**\n\n` +
                        `**B)** ${scenario.optionB}\n` +
                        `${emoji.chart} ${percentB}% (${votes.b.length} votes)\n\n` +
                        `${emoji.trophy} **Winner: Option ${winner}**`
                    )
                    .setColor(emoji.color_success)
                    .setFooter({ text: `Final Results - ${total} total votes` });
                
                await response.edit({ embeds: [finalEmbed], components: [row] }).catch(() => {});
            });
        } catch (error) {
            console.error(`[Command Error] wouldyourather.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to start the game.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
