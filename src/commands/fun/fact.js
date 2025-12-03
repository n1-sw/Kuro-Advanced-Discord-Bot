const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

const facts = [
    "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible.",
    "Octopuses have three hearts and blue blood.",
    "A group of flamingos is called a 'flamboyance'.",
    "The shortest war in history lasted 38 to 45 minutes between Britain and Zanzibar in 1896.",
    "Bananas are berries, but strawberries aren't.",
    "A day on Venus is longer than a year on Venus.",
    "The inventor of the Pringles can is buried in one.",
    "Cows have best friends and get stressed when separated.",
    "The unicorn is the national animal of Scotland.",
    "A jiffy is an actual unit of time - 1/100th of a second.",
    "The first computer programmer was a woman named Ada Lovelace.",
    "Sharks are older than trees. Sharks have been around for about 400 million years.",
    "A cloud can weigh more than a million pounds.",
    "There are more possible iterations of a game of chess than atoms in the known universe.",
    "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
    "The inventor of the microwave only received $2 for his discovery.",
    "A single strand of spaghetti is called a 'spaghetto'.",
    "The average person walks about 100,000 miles in their lifetime.",
    "Wombat poop is cube-shaped to prevent it from rolling away.",
    "The first oranges weren't orange - they were green.",
    "Polar bears have black skin under their white fur.",
    "Nintendo was founded in 1889 as a playing card company.",
    "The Eiffel Tower can be 15cm taller during the summer due to thermal expansion.",
    "A bolt of lightning is five times hotter than the sun's surface.",
    "The longest hiccuping spree lasted 68 years.",
    "Dolphins sleep with one eye open.",
    "The inventor of the frisbee was turned into a frisbee after he died.",
    "There's a species of jellyfish that is immortal.",
    "The first computer 'bug' was an actual bug - a moth found in Harvard's computer.",
    "The moon is slowly moving away from Earth at about 3.8cm per year."
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fact')
        .setDescription('Get a random interesting fact'),
    
    async execute(interaction) {
        try {
            const fact = facts[Math.floor(Math.random() * facts.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.fact} Did You Know?`)
                .setDescription(fact)
                .setColor(emoji.color_info)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] fact.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: `${emoji.error} Couldn't fetch a fact right now.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
