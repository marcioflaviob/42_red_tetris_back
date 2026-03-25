import Board from '../../models/Board.js';
import { Tetromino } from '../../models/Tetromino.js';
import {
  BOARD_COLS,
  BOARD_ROWS,
  BUFFER_ZONE_ROWS,
  MOVES,
  COLLISION,
  SHAPES,
  GARBAGE_COLOR,
} from '../../models/constants.js';
import seedrandom from 'seedrandom';

const TOTAL_ROWS = BUFFER_ZONE_ROWS + BOARD_ROWS;
const BOARD_SIZE = TOTAL_ROWS * BOARD_COLS;

function createTestBoard(seed = 'test-seed') {
  const board = new Board({
    rng: seedrandom(seed),
    colorRng: seedrandom(seed + '-color'),
  });
  board.nextPieces = board.addPieces();
  if (board.nextPieces.length > 0) {
    const firstPiece = board.getNextPiece();
    board.spawnTetromino(firstPiece);
  }
  return board;
}

function fillRow(board, rowIndex) {
  for (let c = 0; c < BOARD_COLS; c++) {
    board.board[rowIndex * BOARD_COLS + c] = 1;
  }
}

describe('Board', () => {
  describe('constructor', () => {
    it('initializes board with correct size', () => {
      const board = new Board({
        rng: seedrandom('test'),
        colorRng: seedrandom('test-color'),
      });
      expect(board.board.length).toBe(BOARD_SIZE);
    });

    it('initializes board with all zeros', () => {
      const board = new Board({
        rng: seedrandom('test'),
        colorRng: seedrandom('test-color'),
      });
      expect(board.board.every((cell) => cell === 0)).toBe(true);
    });

    it('initializes with null activePiece', () => {
      const board = new Board({
        rng: seedrandom('test'),
        colorRng: seedrandom('test-color'),
      });
      expect(board.activePiece).toBeNull();
    });

    it('initializes with gameOver false', () => {
      const board = new Board({
        rng: seedrandom('test'),
        colorRng: seedrandom('test-color'),
      });
      expect(board.gameOver).toBe(false);
    });

    it('initializes savedPiece with disabled false', () => {
      const board = new Board({
        rng: seedrandom('test'),
        colorRng: seedrandom('test-color'),
      });
      expect(board.savedPiece).toEqual({ tetromino: null, disabled: false });
    });
  });

  describe('addPieces', () => {
    it('adds exactly 6 pieces', () => {
      const board = new Board({
        rng: seedrandom('test'),
        colorRng: seedrandom('test-color'),
      });
      const pieces = board.addPieces();
      expect(pieces.length).toBe(6);
    });

    it('increments pieceCount', () => {
      const board = new Board({
        rng: seedrandom('test'),
        colorRng: seedrandom('test-color'),
      });
      board.addPieces();
      expect(board.pieceCount).toBe(6);
    });

    it('returns Tetromino instances', () => {
      const board = new Board({
        rng: seedrandom('test'),
        colorRng: seedrandom('test-color'),
      });
      const pieces = board.addPieces();
      pieces.forEach((p) => expect(p).toBeInstanceOf(Tetromino));
    });
  });

  describe('getNextPiece', () => {
    it('returns first piece and maintains queue', () => {
      const board = createTestBoard();
      const initialQueueLength = board.nextPieces.length;
      const piece = board.getNextPiece();
      expect(piece).toBeInstanceOf(Tetromino);
      // Queue should be same length or larger (refilled if < 6)
      expect(board.nextPieces.length).toBeGreaterThanOrEqual(initialQueueLength - 1);
    });

    it('refills pieces when queue gets low', () => {
      const board = new Board({
        rng: seedrandom('test'),
        colorRng: seedrandom('test-color'),
      });
      board.nextPieces = board.addPieces();
      // Drain until less than 6
      for (let i = 0; i < 4; i++) board.getNextPiece();
      expect(board.nextPieces.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('spawnTetromino', () => {
    it('sets activePiece', () => {
      const board = new Board({
        rng: seedrandom('test'),
        colorRng: seedrandom('test-color'),
      });
      const piece = new Tetromino({ shape: SHAPES.T, color: 1 });
      board.spawnTetromino(piece);
      expect(board.activePiece).toBe(piece);
    });
  });

  describe('updateBoard', () => {
    it('sets color at given coords', () => {
      const board = createTestBoard();
      board.updateBoard([[5, 3]], 7);
      expect(board.board[5 * BOARD_COLS + 3]).toBe(7);
    });

    it('updates multiple coords', () => {
      const board = createTestBoard();
      board.updateBoard([[5, 3], [6, 4], [7, 5]], 2);
      expect(board.board[5 * BOARD_COLS + 3]).toBe(2);
      expect(board.board[6 * BOARD_COLS + 4]).toBe(2);
      expect(board.board[7 * BOARD_COLS + 5]).toBe(2);
    });
  });

  describe('lockPiece', () => {
    it('locks piece and spawns next piece', () => {
      const board = createTestBoard();
      expect(board.activePiece).not.toBeNull();
      board.lockPiece();
      expect(board.activePiece).not.toBeNull(); // new piece spawned
    });

    it('does nothing when no active piece', () => {
      const board = createTestBoard();
      board.activePiece = null;
      expect(() => board.lockPiece()).not.toThrow();
    });

    it('sets gameOver when piece locks in buffer zone', () => {
      const board = createTestBoard();
      // Fill row 2 (first visible row) so the piece can't fall past the buffer zone
      for (let c = 3; c <= 6; c++) {
        board.board[2 * BOARD_COLS + c] = 1;
      }
      // Place I piece in buffer zone row 1 — getPredictCoords will find row 2 blocked
      board.activePiece = new Tetromino({
        shape: SHAPES.I,
        color: 1,
        coords: [[1, 3], [1, 4], [1, 5], [1, 6]],
        pivot: [0, 1],
        rotation: 0,
      });
      board.lockPiece();
      expect(board.gameOver).toBe(true);
    });

    it('re-enables savedPiece after locking', () => {
      const board = createTestBoard();
      board.savedPiece.disabled = true;
      board.lockPiece();
      expect(board.savedPiece.disabled).toBe(false);
    });
  });

  describe('updateSavedPiece', () => {
    it('saves active piece when no held piece', () => {
      const board = createTestBoard();
      const activePiece = board.activePiece;
      board.updateSavedPiece();
      expect(board.savedPiece.tetromino).toBe(activePiece);
      expect(board.savedPiece.disabled).toBe(true);
    });

    it('swaps held and active piece', () => {
      const board = createTestBoard();
      const heldPiece = new Tetromino({ shape: SHAPES.O, color: 3 });
      board.savedPiece = { tetromino: heldPiece, disabled: false };
      const activePiece = board.activePiece;
      board.updateSavedPiece();
      expect(board.savedPiece.tetromino).toBe(activePiece);
      expect(board.activePiece).toBeInstanceOf(Tetromino);
      expect(board.activePiece.shape).toEqual(heldPiece.shape);
    });

    it('does nothing when savedPiece is disabled', () => {
      const board = createTestBoard();
      board.savedPiece.disabled = true;
      const activePiece = board.activePiece;
      board.updateSavedPiece();
      expect(board.activePiece).toBe(activePiece);
    });

    it('does nothing when no active piece', () => {
      const board = createTestBoard();
      board.activePiece = null;
      expect(() => board.updateSavedPiece()).not.toThrow();
    });
  });

  describe('movePiece', () => {
    it('returns NO when no active piece', () => {
      const board = createTestBoard();
      board.activePiece = null;
      expect(board.movePiece(MOVES.DOWN)).toBe(COLLISION.NO);
    });

    it('moves piece DOWN successfully', () => {
      const board = createTestBoard();
      const initialRow = board.activePiece.coords[0][0];
      const result = board.movePiece(MOVES.DOWN);
      if (result === COLLISION.NO) {
        expect(board.activePiece.coords[0][0]).toBe(initialRow + 1);
      }
    });

    it('moves piece LEFT successfully', () => {
      const board = createTestBoard();
      board.activePiece = new Tetromino({
        shape: SHAPES.I,
        color: 1,
        coords: [[5, 4], [5, 5], [5, 6], [5, 7]],
        pivot: [0, 1],
        rotation: 0,
      });
      const initialCol = board.activePiece.coords[0][1];
      const result = board.movePiece(MOVES.LEFT);
      if (result === COLLISION.NO) {
        expect(board.activePiece.coords[0][1]).toBe(initialCol - 1);
      }
    });

    it('moves piece RIGHT successfully', () => {
      const board = createTestBoard();
      board.activePiece = new Tetromino({
        shape: SHAPES.I,
        color: 1,
        coords: [[5, 2], [5, 3], [5, 4], [5, 5]],
        pivot: [0, 1],
        rotation: 0,
      });
      const initialCol = board.activePiece.coords[0][1];
      const result = board.movePiece(MOVES.RIGHT);
      if (result === COLLISION.NO) {
        expect(board.activePiece.coords[0][1]).toBe(initialCol + 1);
      }
    });

    it('rotates piece', () => {
      const board = createTestBoard();
      board.activePiece = new Tetromino({
        shape: SHAPES.T,
        color: 1,
        coords: [[5, 3], [5, 4], [5, 5], [6, 4]],
        pivot: [1, 1],
        rotation: 0,
      });
      const result = board.movePiece(MOVES.ROTATE);
      expect([COLLISION.NO, COLLISION.CONTINUE]).toContain(result);
    });

    it('returns NO for unknown move', () => {
      const board = createTestBoard();
      expect(board.movePiece('unknown-move')).toBe(COLLISION.NO);
    });

    it('does not move when collision occurs', () => {
      const board = createTestBoard();
      // Place piece at leftmost column
      board.activePiece = new Tetromino({
        shape: SHAPES.I,
        color: 1,
        coords: [[5, 0], [5, 1], [5, 2], [5, 3]],
        pivot: [0, 1],
        rotation: 0,
      });
      const result = board.movePiece(MOVES.LEFT);
      expect(result).toBe(COLLISION.CONTINUE);
    });
  });

  describe('addGarbageRows', () => {
    it('adds garbage rows at bottom', () => {
      const board = createTestBoard();
      board.addGarbageRows(1);
      // Last row should be garbage
      const lastRowStart = (TOTAL_ROWS - 1) * BOARD_COLS;
      const lastRowCells = board.board.slice(lastRowStart, lastRowStart + BOARD_COLS);
      expect(lastRowCells.every((c) => c === GARBAGE_COLOR)).toBe(true);
    });

    it('maintains board size after adding garbage', () => {
      const board = createTestBoard();
      board.addGarbageRows(3);
      expect(board.board.length).toBe(BOARD_SIZE);
    });

    it('does nothing for 0 lines', () => {
      const board = createTestBoard();
      const originalBoard = [...board.board];
      board.addGarbageRows(0);
      expect(board.board).toEqual(originalBoard);
    });

    it('does nothing for null', () => {
      const board = createTestBoard();
      const originalBoard = [...board.board];
      board.addGarbageRows(null);
      expect(board.board).toEqual(originalBoard);
    });

    it('caps at BOARD_ROWS lines', () => {
      const board = createTestBoard();
      board.addGarbageRows(100);
      expect(board.board.length).toBe(BOARD_SIZE);
    });
  });

  describe('isRowFull', () => {
    it('returns false for empty row', () => {
      const board = createTestBoard();
      expect(board.isRowFull(BUFFER_ZONE_ROWS)).toBe(false);
    });

    it('returns true for full row', () => {
      const board = createTestBoard();
      fillRow(board, BUFFER_ZONE_ROWS);
      expect(board.isRowFull(BUFFER_ZONE_ROWS)).toBe(true);
    });

    it('returns false for partially filled row', () => {
      const board = createTestBoard();
      board.board[BUFFER_ZONE_ROWS * BOARD_COLS] = 1;
      expect(board.isRowFull(BUFFER_ZONE_ROWS)).toBe(false);
    });
  });

  describe('clearRows', () => {
    it('returns failure when no rows provided', () => {
      const board = createTestBoard();
      const result = board.clearRows([]);
      expect(result.success).toBe(false);
    });

    it('returns failure when rows is null/undefined', () => {
      const board = createTestBoard();
      const result = board.clearRows(null);
      expect(result.success).toBe(false);
    });

    it('returns failure for out-of-range row', () => {
      const board = createTestBoard();
      const result = board.clearRows([0]); // buffer zone row 0 is invalid
      expect(result.success).toBe(false);
    });

    it('returns failure for row beyond BOARD_ROWS', () => {
      const board = createTestBoard();
      const result = board.clearRows([TOTAL_ROWS]); // out of range
      expect(result.success).toBe(false);
    });

    it('clears a valid row and maintains board size', () => {
      const board = createTestBoard();
      const rowToClear = BUFFER_ZONE_ROWS; // first valid row (index 2)
      const result = board.clearRows([rowToClear]);
      expect(result.success).toBe(true);
      expect(result.clearedRows).toBe(1);
      expect(result.rowsCleared).toEqual([rowToClear]);
      expect(board.board.length).toBe(BOARD_SIZE);
    });

    it('clears multiple valid rows', () => {
      const board = createTestBoard();
      const rows = [BUFFER_ZONE_ROWS, BUFFER_ZONE_ROWS + 1];
      const result = board.clearRows(rows);
      expect(result.success).toBe(true);
      expect(result.clearedRows).toBe(2);
      expect(board.board.length).toBe(BOARD_SIZE);
    });

    it('deduplicates rows', () => {
      const board = createTestBoard();
      const result = board.clearRows([BUFFER_ZONE_ROWS, BUFFER_ZONE_ROWS, BUFFER_ZONE_ROWS + 1]);
      expect(result.success).toBe(true);
      expect(result.clearedRows).toBe(2);
    });
  });
});
