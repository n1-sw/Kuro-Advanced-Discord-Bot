const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js')
const emoji = require('../../utils/emoji')
const AdvancedEmbed = require('../../utils/advancedEmbed')
const { users } = require('../../utils/database')
const { formatNumber } = require('../../utils/helpers')

const PIECES = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
    '.': '·'
};

class ChessGame {
    constructor(player1, player2, bet) {
        this.board = this.initBoard()
        this.player1 = player1;
        this.player2 = player2;
        this.currentPlayer = player1;
        this.bet = bet;
        this.winner = null;
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.resigned = false;
    }

    initBoard() {
        return [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            ['.', '.', '.', '.', '.', '.', '.', '.'],
            ['.', '.', '.', '.', '.', '.', '.', '.'],
            ['.', '.', '.', '.', '.', '.', '.', '.'],
            ['.', '.', '.', '.', '.', '.', '.', '.'],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
    }

    isWhite(piece) {
        return piece !== '.' && piece === piece.toUpperCase()
    }

    isBlack(piece) {
        return piece !== '.' && piece === piece.toLowerCase()
    }

    getCurrentColor() {
        return this.currentPlayer === this.player1 ? 'white' : 'black';
    }

    getPieceAt(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return this.board[row][col];
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (piece === '.') return [];

        const isWhitePiece = this.isWhite(piece)
        const moves = [];
        const pieceType = piece.toLowerCase()

        const addMove = (r, c) => {
            if (r < 0 || r > 7 || c < 0 || c > 7) return false;
            const target = this.board[r][c];
            if (target === '.') {
                moves.push({ row: r, col: c })
                return true;
            }
            if ((isWhitePiece && this.isBlack(target)) || (!isWhitePiece && this.isWhite(target))) {
                moves.push({ row: r, col: c })
            }
            return false;
        };

        const addSlidingMoves = (directions) => {
            for (const [dr, dc] of directions) {
                for (let i = 1; i < 8; i++) {
                    if (!addMove(row + dr * i, col + dc * i)) break;
                    if (this.board[row + dr * i]?.[col + dc * i] !== '.') break;
                }
            }
        };

        switch (pieceType) {
            case 'p':
                const dir = isWhitePiece ? -1 : 1;
                const startRow = isWhitePiece ? 6 : 1;
                if (this.board[row + dir]?.[col] === '.') {
                    moves.push({ row: row + dir, col })
                    if (row === startRow && this.board[row + 2 * dir]?.[col] === '.') {
                        moves.push({ row: row + 2 * dir, col })
                    }
                }
                for (const dc of [-1, 1]) {
                    const target = this.board[row + dir]?.[col + dc];
                    if (target && target !== '.' && 
                        ((isWhitePiece && this.isBlack(target)) || (!isWhitePiece && this.isWhite(target)))) {
                        moves.push({ row: row + dir, col: col + dc })
                    }
                }
                break;
            case 'n':
                for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
                    addMove(row + dr, col + dc)
                }
                break;
            case 'b':
                addSlidingMoves([[-1,-1],[-1,1],[1,-1],[1,1]])
                break;
            case 'r':
                addSlidingMoves([[-1,0],[1,0],[0,-1],[0,1]])
                break;
            case 'q':
                addSlidingMoves([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]])
                break;
            case 'k':
                for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                    addMove(row + dr, col + dc)
                }
                break;
        }

        return moves;
    }

    selectPiece(row, col) {
        const piece = this.board[row][col];
        if (piece === '.') return false;

        const isWhitePiece = this.isWhite(piece)
        const isWhiteTurn = this.currentPlayer === this.player1;

        if (isWhitePiece !== isWhiteTurn) return false;

        this.selectedPiece = { row, col };
        this.validMoves = this.getValidMoves(row, col)
        return true;
    }

    makeMove(toRow, toCol) {
        if (!this.selectedPiece) return false;

        const isValid = this.validMoves.some(m => m.row === toRow && m.col === toCol)
        if (!isValid) return false;

        const { row: fromRow, col: fromCol } = this.selectedPiece;
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];

        if (captured.toLowerCase() === 'k') {
            this.winner = this.currentPlayer;
        }

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = '.';

        if ((piece === 'P' && toRow === 0) || (piece === 'p' && toRow === 7)) {
            this.board[toRow][toCol] = piece === 'P' ? 'Q' : 'q';
        }

        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece,
            captured
        })

        this.selectedPiece = null;
        this.validMoves = [];
        this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;

        return true;
    }

    resign() {
        this.resigned = true;
        this.winner = this.currentPlayer === this.player1 ? this.player2 : this.player1;
    }

    render() {
        const cols = '    a   b   c   d   e   f   g   h';
        let display = cols + '\n  ╔═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╗\n';

        for (let row = 0; row < 8; row++) {
            display += `${8 - row} ║`;
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                const isSelected = this.selectedPiece?.row === row && this.selectedPiece?.col === col;
                const isValidMove = this.validMoves.some(m => m.row === row && m.col === col)
                
                let cell = ` ${PIECES[piece]} `;
                if (isSelected) cell = `[${PIECES[piece]}]`;
                else if (isValidMove) cell = ` ○ `;
                
                display += cell + (col < 7 ? '│' : '')
            }
            display += `║ ${8 - row}\n`;
            if (row < 7) display += '  ╟───┼───┼───┼───┼───┼───┼───┼───╢\n';
        }

        display += '  ╚═══╧═══╧═══╧═══╧═══╧═══╧═══╧═══╝\n' + cols;
        return display;
    }
}

const activeGames = new Map()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chess')
        .setDescription('Play Chess against another player')
        .addUserOption(opt =>
            opt.setName('opponent')
                .setDescription('Challenge a user')
                .setRequired(true))
        .addIntegerOption(opt =>
            opt.setName('bet')
                .setDescription('Amount to bet (optional)')
                .setMinValue(50)
                .setMaxValue(1000)),

    async execute(interaction) {
        try {
            const opponent = interaction.options.getUser('opponent')
            const bet = interaction.options.getInteger('bet') || 0;
            const player1 = interaction.user;

            if (opponent.id === player1.id) {
                return interaction.reply({ content: `${emoji.error} You can't play against yourself!`, flags: 64 })
            }

            if (opponent.bot) {
                return interaction.reply({ content: `${emoji.error} You can't play against bots!`, flags: 64 })
            }

            if (activeGames.has(player1.id) || activeGames.has(opponent.id)) {
                return interaction.reply({ content: `${emoji.error} One of the players is already in a game!`, flags: 64 })
            }

            if (bet > 0) {
                const p1DataCheck = await users.get(interaction.guild.id, player1.id);
                const p2DataCheck = await users.get(interaction.guild.id, opponent.id);
                if ((p1DataCheck.coins || 0) < bet) {
                    return interaction.reply({ content: `${emoji.error} You don't have enough coins!`, flags: 64 })
                }
                if ((p2DataCheck.coins || 0) < bet) {
                    return interaction.reply({ content: `${emoji.error} ${opponent.username} doesn't have enough coins!`, flags: 64 })
                }
            }

            const challengeEmbed = new EmbedBuilder()
                .setTitle(`${emoji.games} Chess Challenge!`)
                .setDescription(`${player1} (White ♔) challenges ${opponent} (Black ♚)!${bet > 0 ? `\n**Bet:** ${formatNumber(bet)} coins each` : ''}`)
                .setColor(emoji.color_success)
                .setFooter({ text: 'Challenge expires in 60 seconds' })

            const acceptRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('chess_accept').setLabel('Accept').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('chess_decline').setLabel('Decline').setStyle(ButtonStyle.Danger)
            )

            const response = await interaction.reply({
                content: `${opponent}`,
                embeds: [challengeEmbed],
                components: [acceptRow]
            })

            const collector = response.createMessageComponentCollector({ time: 60000 })

            collector.on('collect', async (i) => {
                if (i.user.id !== opponent.id) {
                    return i.reply({ content: `${emoji.error} Only ${opponent} can respond!`, flags: 64 })
                }

                if (i.customId === 'chess_decline') {
                    const declineEmbed = new EmbedBuilder()
                        .setDescription(`${emoji.error} ${opponent.username} declined the challenge.`)
                        .setColor(emoji.color_success)
                    await i.update({ embeds: [declineEmbed], components: [] })
                    collector.stop()
                    return;
                }

                let betsDeducted = false;
                let game = null;
                
                const refundBets = async () => {
                    if (betsDeducted && bet > 0) {
                        try {
                            const refundP1 = await users.get(interaction.guild.id, player1.id);
                            const refundP2 = await users.get(interaction.guild.id, opponent.id);
                            await users.update(interaction.guild.id, player1.id, { coins: (refundP1.coins || 0) + bet });
                            await users.update(interaction.guild.id, opponent.id, { coins: (refundP2.coins || 0) + bet });
                            console.log(`[Chess] Refunded ${bet} coins to both players`);
                        } catch (refundError) {
                            console.error('[Chess] Refund error:', refundError.message);
                        }
                    }
                    activeGames.delete(player1.id);
                    activeGames.delete(opponent.id);
                };

                try {
                    if (bet > 0) {
                        const currentP1Data = await users.get(interaction.guild.id, player1.id);
                        const currentP2Data = await users.get(interaction.guild.id, opponent.id);
                        if ((currentP1Data.coins || 0) < bet) {
                            await i.update({ embeds: [new EmbedBuilder().setDescription(`${emoji.error} ${player1.username} no longer has enough coins!`).setColor(emoji.color_error)], components: [] })
                            return;
                        }
                        if ((currentP2Data.coins || 0) < bet) {
                            await i.update({ embeds: [new EmbedBuilder().setDescription(`${emoji.error} ${opponent.username} no longer has enough coins!`).setColor(emoji.color_error)], components: [] })
                            return;
                        }
                        await users.update(interaction.guild.id, player1.id, { coins: (currentP1Data.coins || 0) - bet });
                        await users.update(interaction.guild.id, opponent.id, { coins: (currentP2Data.coins || 0) - bet });
                        betsDeducted = true;
                    }

                    game = new ChessGame(player1.id, opponent.id, bet)
                    activeGames.set(player1.id, game)
                    activeGames.set(opponent.id, game)

                const createGameEmbed = () => {
                    let status;
                    if (game.winner) {
                        const winnerUser = game.winner === player1.id ? player1 : opponent;
                        status = game.resigned ? 
                            `${emoji.warning} Game ended by resignation. ${winnerUser.username} wins!` :
                            `${emoji.success} Checkmate! ${winnerUser.username} wins!`;
                    } else {
                        const currentUser = game.currentPlayer === player1.id ? player1 : opponent;
                        const color = game.currentPlayer === player1.id ? 'White' : 'Black';
                        status = `${currentUser.username}'s turn (${color})`;
                        if (game.selectedPiece) {
                            const col = String.fromCharCode(97 + game.selectedPiece.col)
                            const row = 8 - game.selectedPiece.row;
                            status += `\nSelected: ${col}${row}`;
                        }
                    }

                    return new EmbedBuilder()
                        .setTitle(`${emoji.games} Chess`)
                        .setDescription(`${player1} (♔) vs ${opponent} (♚)\n\`\`\`\n${game.render()}\n\`\`\`\n${status}${bet > 0 ? `\n**Bet:** ${formatNumber(bet)} coins` : ''}`)
                        .setColor(game.winner ? 0x00FF00 : 0x5865F2)
                        .setFooter({ text: 'Select a square from the dropdown' })
                };

                const createMoveSelect = (disabled = false) => {
                    const options = [];
                    
                    if (!game.selectedPiece) {
                        for (let row = 0; row < 8; row++) {
                            for (let col = 0; col < 8; col++) {
                                const piece = game.board[row][col];
                                if (piece === '.') continue;
                                
                                const isWhite = game.isWhite(piece)
                                const isWhiteTurn = game.currentPlayer === player1.id;
                                if (isWhite !== isWhiteTurn) continue;
                                
                                const moves = game.getValidMoves(row, col)
                                if (moves.length === 0) continue;
                                
                                const colLetter = String.fromCharCode(97 + col)
                                const rowNum = 8 - row;
                                options.push({
                                    label: `${PIECES[piece]} ${colLetter}${rowNum}`,
                                    value: `select_${row}_${col}`,
                                    description: `Select ${PIECES[piece]} at ${colLetter}${rowNum}`
                                })
                            }
                        }
                    } else {
                        options.push({
                            label: 'Cancel Selection',
                            value: 'cancel',
                            description: 'Deselect the current piece'
                        })
                        
                        for (const move of game.validMoves) {
                            const colLetter = String.fromCharCode(97 + move.col)
                            const rowNum = 8 - move.row;
                            const target = game.board[move.row][move.col];
                            const desc = target !== '.' ? `Capture ${PIECES[target]}` : 'Move here';
                            options.push({
                                label: `→ ${colLetter}${rowNum}`,
                                value: `move_${move.row}_${move.col}`,
                                description: desc
                            })
                        }
                    }

                    if (options.length === 0) {
                        options.push({ label: 'No moves available', value: 'none', description: 'No valid moves' })
                    }

                    return new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('chess_move')
                            .setPlaceholder(game.selectedPiece ? 'Choose destination...' : 'Select a piece to move...')
                            .addOptions(options.slice(0, 25))
                            .setDisabled(disabled)
                    )
                };

                const createResignButton = (disabled = false) => {
                    return new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('chess_resign')
                            .setLabel('Resign')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(disabled)
                    )
                };

                await i.update({ 
                    content: null, 
                    embeds: [createGameEmbed()], 
                    components: [createMoveSelect(), createResignButton()] 
                })

                const gameCollector = response.createMessageComponentCollector({ time: 1800000 })

                gameCollector.on('collect', async (gi) => {
                    if (gi.user.id !== game.currentPlayer) {
                        return gi.reply({ content: `${emoji.error} It's not your turn!`, flags: 64 })
                    }

                    if (gi.customId === 'chess_resign') {
                        game.resign()
                        if (bet > 0) {
                            const winnerData = await users.get(interaction.guild.id, game.winner);
                            await users.update(interaction.guild.id, game.winner, { coins: (winnerData.coins || 0) + bet * 2 });
                        }
                        activeGames.delete(player1.id)
                        activeGames.delete(opponent.id)
                        await gi.update({ 
                            embeds: [createGameEmbed()], 
                            components: [createMoveSelect(true), createResignButton(true)] 
                        })
                        gameCollector.stop()
                        return;
                    }

                    if (gi.customId === 'chess_move') {
                        const value = gi.values[0];
                        
                        if (value === 'none') {
                            return gi.reply({ content: `${emoji.error} No valid moves!`, flags: 64 })
                        }
                        
                        if (value === 'cancel') {
                            game.selectedPiece = null;
                            game.validMoves = [];
                            await gi.update({ embeds: [createGameEmbed()], components: [createMoveSelect(), createResignButton()] })
                            return;
                        }

                        const [action, row, col] = value.split('_')
                        
                        if (action === 'select') {
                            game.selectPiece(parseInt(row), parseInt(col))
                            await gi.update({ embeds: [createGameEmbed()], components: [createMoveSelect(), createResignButton()] })
                        } else if (action === 'move') {
                            game.makeMove(parseInt(row), parseInt(col))
                            
                            if (game.winner) {
                                if (bet > 0) {
                                    const winnerData = await users.get(interaction.guild.id, game.winner);
                                    await users.update(interaction.guild.id, game.winner, { coins: (winnerData.coins || 0) + bet * 2 });
                                }
                                activeGames.delete(player1.id)
                                activeGames.delete(opponent.id)
                                await gi.update({ 
                                    embeds: [createGameEmbed()], 
                                    components: [createMoveSelect(true), createResignButton(true)] 
                                })
                                gameCollector.stop()
                            } else {
                                await gi.update({ 
                                    embeds: [createGameEmbed()], 
                                    components: [createMoveSelect(), createResignButton()] 
                                })
                            }
                        }
                    }
                })

                gameCollector.on('end', async (collected, reason) => {
                    if (!game.winner && betsDeducted && bet > 0) {
                        await refundBets();
                    } else {
                        activeGames.delete(player1.id);
                        activeGames.delete(opponent.id);
                    }
                })

                collector.stop()
                } catch (gameError) {
                    console.error('[Chess] Game setup error:', gameError.message);
                    await refundBets();
                    throw gameError;
                }
            })

            collector.on('end', (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setDescription(`${emoji.error} Challenge expired.`)
                        .setColor(emoji.color_success)
                    response.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {})
                }
            })

        } catch (error) {
            console.error(`[Command Error] chess.js:`, error.message)
            if (!interaction.replied) {
                await interaction.reply({ content: `${emoji.error} Error starting game.`, flags: 64 }).catch(() => {})
            }
        }
    }
};
