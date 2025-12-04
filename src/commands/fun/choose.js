const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('choose')
        .setDescription('Let the bot randomly choose between options')
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Options separated by | (e.g., "pizza | pasta | salad")')
                .setRequired(true)),
    
    async execute(interaction) {
        try {
            const input = interaction.options.getString('options');
            const options = input.split('|').map(opt => opt.trim()).filter(opt => opt.length > 0);
            
            if (options.length < 2) {
                return interaction.reply({
                    content: `${emoji.warning} Please provide at least 2 options separated by \`|\`\nExample: \`/choose options:pizza | pasta | salad\``,
                    flags: 64
                });
            }
            
            if (options.length > 20) {
                return interaction.reply({
                    content: `${emoji.warning} Too many options! Maximum is 20 options.`,
                    flags: 64
                });
            }
            
            const chosen = options[Math.floor(Math.random() * options.length)];
            
            const optionsList = options.map((opt, i) => 
                opt === chosen ? `**${i + 1}.** ${emoji.star} **${opt}** ${emoji.arrow_left}` : `**${i + 1}.** ${opt}`
            ).join('\n');
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.thinking} I Choose...`)
                .setDescription(
                    `From ${options.length} options, I have chosen:\n\n` +
                    `${emoji.sparkles} **${chosen}** ${emoji.sparkles}\n\n` +
                    `**All options:**\n${optionsList}`
                )
                .setColor(emoji.color_fun)
                .setFooter({ 
                    text: `Requested by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] choose.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to make a choice.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
