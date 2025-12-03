const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

const memeTemplates = [
    { title: "When the code finally works", text: "But you don't know why..." },
    { title: "Me: I'll fix this bug in 5 minutes", text: "3 hours later: Why did I become a programmer?" },
    { title: "That moment when", text: "You realize it's a semicolon missing" },
    { title: "Client: Can you make this small change?", text: "The entire codebase: *collapses*" },
    { title: "Monday morning be like", text: "Where is the coffee? WHERE IS THE COFFEE?!" },
    { title: "Me explaining to my mom what I do", text: "Mom: So you fix computers? Me: ...yes." },
    { title: "When you fix one bug", text: "And create 7 more in the process" },
    { title: "Stack Overflow", text: "The real hero of every programmer" },
    { title: "My code at 2 AM", text: "if (works) { dont_touch(); }" },
    { title: "When someone watches you code", text: "Brain.exe has stopped working" },
    { title: "Git commit -m 'final fix'", text: "Git commit -m 'final fix 2' Git commit -m 'actually final'..." },
    { title: "It works on my machine", text: "Famous last words of every developer" },
    { title: "When the deadline is tomorrow", text: "But you haven't started yet and need 'inspiration'" },
    { title: "The customer wants it like this", text: "The budget allows for this: [stick figure]" },
    { title: "Before coffee vs After coffee", text: "Zombie mode → Slightly less zombie mode" }
];

const reactions = ['😂', '🤣', '💀', '😭', '🔥', '💯', '😆', '🙃'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Get a random text meme'),
    
    async execute(interaction) {
        try {
            const meme = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];
            const reaction = reactions[Math.floor(Math.random() * reactions.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.meme} ${meme.title}`)
                .setDescription(`*${meme.text}*\n\n${reaction}`)
                .setColor(emoji.color_fun)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] meme.js:`, error.message);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: `${emoji.error} Couldn't generate a meme right now.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
