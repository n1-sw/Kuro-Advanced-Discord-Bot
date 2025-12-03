const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');
const { users } = require('../../utils/database');

const triviaQuestions = [
    { question: "What is the capital of Japan?", answers: ["Tokyo", "Osaka", "Kyoto", "Hiroshima"], correct: 0 },
    { question: "Which planet is known as the Red Planet?", answers: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
    { question: "What year did World War II end?", answers: ["1943", "1944", "1945", "1946"], correct: 2 },
    { question: "What is the largest ocean on Earth?", answers: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 },
    { question: "Who painted the Mona Lisa?", answers: ["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"], correct: 0 },
    { question: "What is the chemical symbol for gold?", answers: ["Go", "Au", "Ag", "Gd"], correct: 1 },
    { question: "Which country has the most natural lakes?", answers: ["USA", "Russia", "Canada", "Brazil"], correct: 2 },
    { question: "What is the smallest country in the world?", answers: ["Monaco", "San Marino", "Liechtenstein", "Vatican City"], correct: 3 },
    { question: "How many hearts does an octopus have?", answers: ["1", "2", "3", "4"], correct: 2 },
    { question: "What is the hardest natural substance on Earth?", answers: ["Diamond", "Titanium", "Platinum", "Tungsten"], correct: 0 },
    { question: "Which element has the atomic number 1?", answers: ["Helium", "Hydrogen", "Oxygen", "Carbon"], correct: 1 },
    { question: "What is the largest mammal in the world?", answers: ["Elephant", "Giraffe", "Blue Whale", "Hippopotamus"], correct: 2 },
    { question: "In what year was the first iPhone released?", answers: ["2005", "2006", "2007", "2008"], correct: 2 },
    { question: "What is the speed of light in km/s (approximately)?", answers: ["300,000", "150,000", "450,000", "600,000"], correct: 0 },
    { question: "Which programming language was created by Guido van Rossum?", answers: ["Java", "Python", "C++", "Ruby"], correct: 1 },
    { question: "What is the main component of the Sun?", answers: ["Oxygen", "Helium", "Hydrogen", "Carbon"], correct: 2 },
    { question: "How many bones are in the adult human body?", answers: ["186", "196", "206", "216"], correct: 2 },
    { question: "Which planet has the most moons?", answers: ["Jupiter", "Saturn", "Uranus", "Neptune"], correct: 1 },
    { question: "What is the currency of Japan?", answers: ["Yuan", "Yen", "Won", "Ringgit"], correct: 1 },
    { question: "Which animal is known as the King of the Jungle?", answers: ["Tiger", "Lion", "Elephant", "Gorilla"], correct: 1 }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Test your knowledge with a trivia question'),
    
    async execute(interaction) {
        try {
            const trivia = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
            const reward = 25;
            
            const buttons = trivia.answers.map((answer, index) => 
                new ButtonBuilder()
                    .setCustomId(`trivia_${index}`)
                    .setLabel(answer)
                    .setStyle(ButtonStyle.Primary)
            );
            
            const row = new ActionRowBuilder().addComponents(buttons);
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.trivia} Trivia Time!`)
                .setDescription(`**${trivia.question}**\n\n${emoji.coin} Reward: **${reward} coins** for correct answer!`)
                .setColor(emoji.color_fun)
                .setFooter({ text: 'You have 20 seconds to answer!' });
            
            const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
            
            const collector = response.createMessageComponentCollector({ time: 20000 });
            
            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return buttonInteraction.reply({ 
                        content: `${emoji.error} This trivia is for ${interaction.user}!`, 
                        flags: 64 
                    });
                }
                
                const selected = parseInt(buttonInteraction.customId.replace('trivia_', ''));
                const isCorrect = selected === trivia.correct;
                
                buttons.forEach((btn, idx) => {
                    btn.setDisabled(true);
                    if (idx === trivia.correct) {
                        btn.setStyle(ButtonStyle.Success);
                    } else if (idx === selected && !isCorrect) {
                        btn.setStyle(ButtonStyle.Danger);
                    } else {
                        btn.setStyle(ButtonStyle.Secondary);
                    }
                });
                
                const updatedRow = new ActionRowBuilder().addComponents(buttons);
                
                let resultEmbed;
                if (isCorrect) {
                    const user = await users.get(interaction.guildId, interaction.user.id);
                    await users.update(interaction.guildId, interaction.user.id, { coins: user.coins + reward });
                    
                    resultEmbed = new EmbedBuilder()
                        .setTitle(`${emoji.success} Correct!`)
                        .setDescription(`**${trivia.question}**\n\n${emoji.success} The answer is **${trivia.answers[trivia.correct]}**!\n\n${emoji.coin} You earned **${reward} coins**!`)
                        .setColor(emoji.color_success)
                        .setFooter({ text: `Answered by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
                } else {
                    resultEmbed = new EmbedBuilder()
                        .setTitle(`${emoji.error} Wrong!`)
                        .setDescription(`**${trivia.question}**\n\n${emoji.error} You answered **${trivia.answers[selected]}**\n${emoji.success} The correct answer was **${trivia.answers[trivia.correct]}**`)
                        .setColor(emoji.color_error)
                        .setFooter({ text: `Answered by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
                }
                
                await buttonInteraction.update({ embeds: [resultEmbed], components: [updatedRow] });
                collector.stop();
            });
            
            collector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    buttons.forEach((btn, idx) => {
                        btn.setDisabled(true);
                        if (idx === trivia.correct) {
                            btn.setStyle(ButtonStyle.Success);
                        } else {
                            btn.setStyle(ButtonStyle.Secondary);
                        }
                    });
                    
                    const updatedRow = new ActionRowBuilder().addComponents(buttons);
                    
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle(`${emoji.clock} Time's Up!`)
                        .setDescription(`**${trivia.question}**\n\n${emoji.success} The correct answer was **${trivia.answers[trivia.correct]}**`)
                        .setColor(emoji.color_warning);
                    
                    await response.edit({ embeds: [timeoutEmbed], components: [updatedRow] }).catch(() => {});
                }
            });
        } catch (error) {
            console.error(`[Command Error] trivia.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to start trivia.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
