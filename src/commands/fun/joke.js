const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

const jokes = [
    { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
    { setup: "Why did the scarecrow win an award?", punchline: "He was outstanding in his field!" },
    { setup: "I told my wife she was drawing her eyebrows too high.", punchline: "She looked surprised." },
    { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up!" },
    { setup: "What do you call a fake noodle?", punchline: "An impasta!" },
    { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" },
    { setup: "What do you call a bear with no teeth?", punchline: "A gummy bear!" },
    { setup: "Why can't you give Elsa a balloon?", punchline: "Because she will let it go!" },
    { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved." },
    { setup: "Why do seagulls fly over the ocean?", punchline: "Because if they flew over the bay, they'd be bagels!" },
    { setup: "I'm reading a book about anti-gravity.", punchline: "It's impossible to put down!" },
    { setup: "Why did the math book look so sad?", punchline: "Because it had so many problems." },
    { setup: "What do you call cheese that isn't yours?", punchline: "Nacho cheese!" },
    { setup: "Why couldn't the bicycle stand up by itself?", punchline: "It was two tired!" },
    { setup: "What did the grape say when it got stepped on?", punchline: "Nothing, it just let out a little wine." },
    { setup: "I used to hate facial hair...", punchline: "But then it grew on me." },
    { setup: "Why don't some couples go to the gym?", punchline: "Because some relationships don't work out." },
    { setup: "What do you call a dinosaur that crashes their car?", punchline: "Tyrannosaurus Wrecks!" },
    { setup: "Why did the coffee file a police report?", punchline: "It got mugged!" },
    { setup: "What's the best thing about Switzerland?", punchline: "I don't know, but the flag is a big plus!" },
    { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!" },
    { setup: "There are only 10 types of people in the world.", punchline: "Those who understand binary and those who don't." },
    { setup: "Why do Java developers wear glasses?", punchline: "Because they can't C#!" },
    { setup: "A SQL query walks into a bar, walks up to two tables and asks...", punchline: "'Can I join you?'" },
    { setup: "Why was the JavaScript developer sad?", punchline: "Because he didn't Node how to Express himself!" }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Get a random joke'),
    
    async execute(interaction) {
        try {
            const joke = jokes[Math.floor(Math.random() * jokes.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.joke} Here's a joke!`)
                .setDescription(`**${joke.setup}**\n\n||${joke.punchline}||`)
                .setColor(emoji.color_fun)
                .setFooter({ text: 'Click the spoiler to reveal the punchline!' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] joke.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: `${emoji.error} Couldn't fetch a joke right now.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
