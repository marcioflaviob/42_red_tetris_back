import Board from '../models/Board.js';
import seedrandom from 'seedrandom';
import roomService from './roomService.js';
import { MOVES } from '../models/constants.js';

class BoardService {
  createBoard(seed) {
    if (!seed) return null;
    const board = new Board({
      rng: seedrandom(seed),
      colorRng: seedrandom(seed + '-color'),
    });

    // Initialize the board with 6 pieces
    board.nextPieces = board.addPieces();

    // Spawn the first piece
    if (board.nextPieces.length > 0) {
      const firstPiece = board.getNextPiece();
      board.spawnTetromino(firstPiece);
    }

    return board;
  }

  movePiece(roomId, sessionId, action) {
    const board = this.getBoardForPlayer(roomId, sessionId);

    if (!board) {
      return { success: false, board: null, reason: 'Board not found' };
    }

    if (board.gameOver) {
      return { success: false, board, reason: 'Game over' };
    }

    try {
      switch (action) {
        case MOVES.DOWN:
        case MOVES.LEFT:
        case MOVES.RIGHT:
        case MOVES.ROTATE:
          board.movePiece(action);
          break;
        case MOVES.SAVE:
          board.updateSavedPiece();
          break;
        case MOVES.SOFT_DROP:
        case MOVES.HARD_DROP:
          board.lockPiece();
          break;
        default:
          console.error('Unknown move action:', action);
          return { success: false, board, reason: 'Unknown action' };
      }

      return { success: true, board };
    } catch (error) {
      console.error('Move execution failed:', error);
      return { success: false, board, reason: error.message };
    }
  }

  getBoardForPlayer(roomId, sessionId) {
    const room = roomService.getRoom({ sessionId }, roomId);
    const user = room?.players?.find((player) => player.sessionId === sessionId);
    return user?.board;
  }
}

export default new BoardService();
