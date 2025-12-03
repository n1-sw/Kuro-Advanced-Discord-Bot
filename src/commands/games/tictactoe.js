const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emoji = require('../../utils/emoji');
const AdvancedEmbed = require('../../utils/advancedEmbed');
const { users } = require('../../utils/database');
const { formatNumber } = require('../../utils/helpers');

const EMPTY = '⬜';
const X = '❌';
const O = '⭕';

class TicTacToeGame {
    constructor(player1, player2, bet) {
        this.board = Array(9).fill(null);
        this.player1 = player1;
        this.player2 = player2;
        this.currentPlayer = player1;
        this.bet = bet;
        this.winner = null;
        this.draw = false;
    }

    getSymbol(player) {
        return player === this.player1 ? X : O;
    }

    makeMove(position) {
        if (this.board[position] !== null || this.winner || this.draw) return false;
        this.board[position] = this.getSymbol(this.currentPlayer);
        if (this.checkWin()) {
            this.winner = this.currentPlayer;
        } else if (this.board.every(cell => cell !== null)) {
            this.draw = true;
        } else {
            this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
        }
        return true;
    }

    checkWin() {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return lines.some(([a, b, c]) => this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]);
    }

    render() {
        let display = '';
        for (let i = 0; i < 9; i += 3) {
            display += `${this.board[i] || EMPTY}${this.board[i+1] || EMPTY}${this.board[i+2] || EMPTY}\n`;
        }
        return display;
    }
}

const activeGames = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Play Tic-Tac-Toe')
        .addUserOption(opt =>
            opt.setName('opponent')
                .setDescription('Challenge a user (leave empty to play vs bot)')
                .setRequired(false))
        .addIntegerOption(opt =>
            opt.setName('bet')
                .setDescription('Amount to bet (optional)')
                .setMinValue(10)
                .setMaxValue(500)),

    async execute(interaction) {
        try {
            const opponent = interaction.options.getUser('opponent');
            const bet = interaction.options.getInteger('bet') || 0;
            const player1 = interaction.user;

            if (activeGames.has(player1.id)) {
                const embed = AdvancedEmbed.warning('Active Game', `${emoji.error} You already have an active game!`);
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            if (opponent && opponent.bot) {
                const embed = AdvancedEmbed.warning('Invalid Opponent', 'You cannot play against bots');
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            const player2 = opponent || { id: 'ai', username: 'AI Bot' };
            const game = new TicTacToeGame(player1.id, player2.id, bet);
            activeGames.set(player1.id, game);

            const createBoard = () => {
                const buttons = [];
                for (let i = 0; i < 9; i += 3) {
                    const row = new ActionRowBuilder();
                    for (let j = 0; j < 3; j++) {
                        const idx = i + j;
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`ttt_${idx}`)
                                .setLabel(game.board[idx] ? game.board[idx] : String(idx + 1))
                                .setStyle(game.board[idx] ? ButtonStyle.Secondary : ButtonStyle.Primary)
                                .setDisabled(!!game.board[idx] || game.winner || game.draw)
                        );
                    }
                    buttons.push(row);
                }
                return buttons;
            };

            const embed = AdvancedEmbed.game(`Tic-Tac-Toe`, `${game.render()}\nPlayer: ${player1.username}\nOpponent: ${player2.username}`, []);
            const response = await interaction.reply({
                embeds: [embed],
                components: createBoard(),
                fetchReply: true
            });

            const collector = response.createMessageComponentCollector({ time: 300000 });

            collector.on('collect', async (i) => {
                if (i.user.id !== game.currentPlayer) {
                    return i.reply({ content: 'Not your turn!', flags: 64 });
                }

                const idx = parseInt(i.customId.split('_')[1]);
                if (!game.makeMove(idx)) {
                    return i.reply({ content: 'Invalid move!', flags: 64 });
                }

                let statusText = '';
                if (game.winner) {
                    statusText = `**${game.winner === player1.id ? player1.username : player2.username} Won!**`;
                } else if (game.draw) {
                    statusText = '**Draw!**';
                } else {
                    statusText = `Current Turn: ${game.currentPlayer === player1.id ? player1.username : player2.username}`;
                }

                const newEmbed = AdvancedEmbed.game(`Tic-Tac-Toe`, `${game.render()}\n${statusText}`, []);
                await i.update({ embeds: [newEmbed], components: createBoard() });

                if (game.winner || game.draw) {
                    collector.stop();
                    activeGames.delete(player1.id);
                }
            });

            collector.on('end', () => {
                activeGames.delete(player1.id);
            });
        } catch (error) {
            console.error(`[Command Error] tictactoe.js:`, error.message);
            const embed = AdvancedEmbed.commandError('Game Failed', 'Could not start game');
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {});
            }
        }
    }
};
