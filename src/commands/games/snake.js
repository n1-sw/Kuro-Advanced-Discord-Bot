const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');
const { users } = require('../../utils/database');
const { formatNumber } = require('../../utils/helpers');

const GRID_SIZE = 8;
const EMPTY = '⬛';
const SNAKE_HEAD = '🟢';
const SNAKE_BODY = '🟩';
const FOOD = '🍎';

class SnakeGame {
    constructor() {
        this.snake = [{ x: 4, y: 4 }];
        this.direction = { x: 0, y: -1 };
        this.food = this.spawnFood();
        this.score = 0;
        this.gameOver = false;
    }

    spawnFood() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
        } while (this.snake.some(s => s.x === pos.x && s.y === pos.y));
        return pos;
    }

    move() {
        if (this.gameOver) return;

        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            this.gameOver = true;
            return;
        }

        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.gameOver = true;
            return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.spawnFood();
        } else {
            this.snake.pop();
        }
    }

    setDirection(dir) {
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };

        const current = Object.entries(directions).find(
            ([, v]) => v.x === this.direction.x && v.y === this.direction.y
        )?.[0];

        if (current && opposites[current] !== dir) {
            this.direction = directions[dir];
        }
    }

    render() {
        let grid = '';
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.food.x === x && this.food.y === y) {
                    grid += FOOD;
                } else if (this.snake[0].x === x && this.snake[0].y === y) {
                    grid += SNAKE_HEAD;
                } else if (this.snake.some(s => s.x === x && s.y === y)) {
                    grid += SNAKE_BODY;
                } else {
                    grid += EMPTY;
                }
            }
            grid += '\n';
        }
        return grid;
    }
}

const activeGames = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snake')
        .setDescription('Play the classic Snake game'),

    async execute(interaction) {
        try {
            if (activeGames.has(interaction.user.id)) {
                const embed = AdvancedEmbed.warning('Active Game', `${emoji.error} You already have an active game!`);
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            const game = new SnakeGame();
            activeGames.set(interaction.user.id, game);

            const createEmbed = () => {
                return AdvancedEmbed.game(`Snake Game`, `${game.render()}\n**Score:** ${game.score}`, []);
            };

            const createButtons = (disabled = false) => {
                const row1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('empty1').setLabel('\u200b').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('up').setEmoji('⬆️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
                    new ButtonBuilder().setCustomId('empty2').setLabel('\u200b').setStyle(ButtonStyle.Secondary).setDisabled(true)
                );
                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('left').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
                    new ButtonBuilder().setCustomId('stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger).setDisabled(disabled),
                    new ButtonBuilder().setCustomId('right').setEmoji('➡️').setStyle(ButtonStyle.Primary).setDisabled(disabled)
                );
                const row3 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('empty3').setLabel('\u200b').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('down').setEmoji('⬇️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
                    new ButtonBuilder().setCustomId('empty4').setLabel('\u200b').setStyle(ButtonStyle.Secondary).setDisabled(true)
                );
                return [row1, row2, row3];
            };

            const response = await interaction.reply({
                embeds: [createEmbed()],
                components: createButtons(),
                fetchReply: true
            });

            const collector = response.createMessageComponentCollector({ time: 120000 });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: `${emoji.error} This game belongs to ${interaction.user}!`, flags: 64 });
                }

                if (i.customId === 'stop' || game.gameOver) {
                    collector.stop();
                    return;
                }

                if (['up', 'down', 'left', 'right'].includes(i.customId)) {
                    game.setDirection(i.customId);
                    game.move();
                }

                if (game.gameOver) {
                    const data = users.get(interaction.guild.id, interaction.user.id);
                    const reward = game.score;
                    userData.coins += reward;
                    users.save();

                    const endEmbed = AdvancedEmbed.game(`Game Over`, `${game.render()}\n**Final Score:** ${game.score}\n**Reward:** +${formatNumber(reward)} coins`, []);
                    await i.update({ embeds: [endEmbed], components: createButtons(true) });
                    activeGames.delete(interaction.user.id);
                } else {
                    await i.update({ embeds: [createEmbed()], components: createButtons() });
                }
            });

            collector.on('end', () => {
                activeGames.delete(interaction.user.id);
            });
        } catch (error) {
            console.error(`[Command Error] snake.js:`, error.message);
            const embed = AdvancedEmbed.commandError('Snake Game Failed', 'Could not start game');
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {});
            }
        }
    }
};
