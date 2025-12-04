const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll dice with custom sides')
        .addIntegerOption(option =>
            option.setName('sides')
                .setDescription('Number of sides on the dice (default: 6)')
                .setMinValue(2)
                .setMaxValue(1000))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Number of dice to roll (default: 1)')
                .setMinValue(1)
                .setMaxValue(20))
        .addIntegerOption(option =>
            option.setName('modifier')
                .setDescription('Add or subtract from the total (e.g., +5 or -3)')
                .setMinValue(-1000)
                .setMaxValue(1000)),
    
    async execute(interaction) {
        try {
            const sides = interaction.options.getInteger('sides') || 6;
            const count = interaction.options.getInteger('count') || 1;
            const modifier = interaction.options.getInteger('modifier') || 0;
            
            const rolls = [];
            for (let i = 0; i < count; i++) {
                rolls.push(Math.floor(Math.random() * sides) + 1);
            }
            
            const sum = rolls.reduce((a, b) => a + b, 0);
            const total = sum + modifier;
            
            const modifierStr = modifier > 0 ? ` + ${modifier}` : modifier < 0 ? ` - ${Math.abs(modifier)}` : '';
            const notation = `${count}d${sides}${modifierStr}`;
            
            const rollsDisplay = rolls.length <= 10 
                ? rolls.map(r => `\`${r}\``).join(' + ')
                : `${rolls.slice(0, 10).map(r => `\`${r}\``).join(' + ')} ... (${rolls.length - 10} more)`;
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji.dice} Dice Roll`)
                .setDescription(
                    `**Notation:** \`${notation}\`\n\n` +
                    `**Rolls:** ${rollsDisplay}\n\n` +
                    `**Sum:** \`${sum}\`${modifier !== 0 ? ` ${modifier > 0 ? '+' : '-'} \`${Math.abs(modifier)}\`` : ''}\n` +
                    `**Total:** **\`${total}\`**`
                )
                .setColor(emoji.color_fun)
                .addFields(
                    { name: `${emoji.chart} Statistics`, value: `Min: \`${Math.min(...rolls)}\` | Max: \`${Math.max(...rolls)}\` | Avg: \`${(sum / count).toFixed(1)}\``, inline: false }
                )
                .setFooter({ 
                    text: `Rolled by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`[Command Error] roll.js:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `${emoji.error} Failed to roll dice.`, 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
};
