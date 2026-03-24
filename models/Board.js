import { BOARD_COLS, BOARD_ROWS, BUFFER_ZONE_ROWS, COLLISION, GARBAGE_COLOR, MOVES } from './constants.js';
import PieceBag from './PieceBag.js';
import { Tetromino } from './Tetromino.js';
import { hasCollided } from './helper.js';
import { rotatePiece } from './rotationHelper.js';

class Board {
  constructor(options = {}) {
    this.board = new Array(BUFFER_ZONE_ROWS * BOARD_COLS + BOARD_ROWS * BOARD_COLS).fill(0);
    this.rng = options.rng;
    this.colorRng = options.colorRng;
    this.pieceBag = new PieceBag();
    this.activePiece = null;
    this.savedPiece = { tetromino: null, disabled: false };
    this.pieceCount = 0;
    this.nextPieces = [];
    this.gameOver = false;
  }

  addPieces = () => {
    const pieces = Array.from({ length: 6 }, () => {
      this.pieceCount += 1;
      return new Tetromino({
        rng: this.rng,
        color: this.pieceBag.getNextColor(this.colorRng),
      });
    });
    return pieces;
  };

  getNextPiece = () => {
    let pieces = [];
    if (this.nextPieces.length < 6) pieces = this.addPieces();
    const [firstPiece, ...rest] = this.nextPieces;
    this.nextPieces = [...rest, ...pieces];
    return firstPiece;
  };

  spawnTetromino = (tetromino) => {
    this.activePiece = tetromino;
  };

  updateBoard = (coords, color) => {
    coords.forEach(([row, col]) => {
      this.board[row * BOARD_COLS + col] = color;
    });
  };

  lockPiece = () => {
    const piece = this.activePiece;
    if (!piece) return;

    const coords = piece.getPredictCoords(this.board);
    this.updateBoard(coords, piece.color);
    this.activePiece = null;

    // Check for game over (piece locked in buffer zone)
    if (coords.some(([r]) => r < BUFFER_ZONE_ROWS)) {
      this.gameOver = true;
      return;
    }

    // Re-enable saved piece if it was disabled
    if (this.savedPiece.disabled) {
      this.savedPiece.disabled = false;
    }

    // Spawn next piece
    const nextPiece = this.getNextPiece();
    this.spawnTetromino(nextPiece);
  };

  updateSavedPiece = () => {
    if (this.savedPiece.disabled) return;

    if (!this.activePiece) return;

    const currentActivePiece = this.activePiece;
    const currentlyHeldPiece = this.savedPiece.tetromino;

    this.savedPiece = {
      tetromino: currentActivePiece,
      disabled: true,
    };

    if (currentlyHeldPiece) {
      this.spawnTetromino(
        new Tetromino({
          shape: currentlyHeldPiece.shape,
          color: currentlyHeldPiece.color,
        })
      );
    } else {
      this.spawnTetromino(this.getNextPiece());
    }
  };

  movePiece = (move) => {
    const piece = this.activePiece;
    if (!piece) return COLLISION.NO;

    let proposed = null;
    let coords = [];
    let shape = piece.shape;

    switch (move) {
      case MOVES.DOWN:
        coords = piece.coords?.map(([r, c]) => [r + 1, c]);
        proposed = {
          coords,
          shape,
          pivot: piece.pivot,
          rotation: piece.rotation,
        };
        break;
      case MOVES.RIGHT:
        coords = piece.coords?.map(([r, c]) => [r, c + 1]);
        proposed = {
          coords,
          shape,
          pivot: piece.pivot,
          rotation: piece.rotation,
        };
        break;
      case MOVES.LEFT:
        coords = piece.coords?.map(([r, c]) => [r, c - 1]);
        proposed = {
          coords,
          shape,
          pivot: piece.pivot,
          rotation: piece.rotation,
        };
        break;
      case MOVES.ROTATE:
        proposed = rotatePiece(piece, this.board);
        if (!proposed) return COLLISION.CONTINUE;
        this.activePiece = new Tetromino({
          shape: proposed.shape,
          color: piece.color,
          coords: proposed.coords,
          pivot: proposed.pivot,
          rotation: proposed.rotation,
        });
        return COLLISION.NO;
      default:
        return COLLISION.NO;
    }

    const collision = hasCollided(move, proposed.coords, this.board);
    if (!collision) {
      this.activePiece = new Tetromino({
        shape: proposed.shape,
        color: piece.color,
        coords: proposed.coords,
        pivot: proposed.pivot,
        rotation: proposed.rotation,
      });
    }
    return collision;
  };

  addGarbageRows = (lines) => {
    if (!lines || lines <= 0) return;
    const linesToAdd = Math.min(lines, BOARD_ROWS);
    for (let i = 0; i < linesToAdd; i++) {
      this.board.splice(0, BOARD_COLS);
      this.board.push(...new Array(BOARD_COLS).fill(GARBAGE_COLOR));
    }
  };

  isRowFull = (rowIndex) => {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (!this.board[rowIndex * BOARD_COLS + c]) {
        return false;
      }
    }
    return true;
  };

  clearRows = (rows) => {
    if (!rows || rows.length === 0) {
      return { success: false, reason: 'No rows provided' };
    }

    // Validate all rows are within valid range
    const startRow = BUFFER_ZONE_ROWS;
    const endRow = BUFFER_ZONE_ROWS + BOARD_ROWS - 1;

    for (const row of rows) {
      if (row < startRow || row > endRow) {
        return { success: false, reason: `Row ${row} is out of valid range` };
      }
    }

    // Clear only rows that are currently full.
    // This keeps the operation idempotent in case a clear-row event is replayed or delayed.
    const rowsToClear = [...new Set(rows)].filter((row) => this.isRowFull(row)).sort((a, b) => a - b);

    rowsToClear.forEach((row) => {
      this.board.splice(row * BOARD_COLS, BOARD_COLS);
      const emptyRow = new Array(BOARD_COLS).fill(0);
      this.board.unshift(...emptyRow);
    });

    return {
      success: true,
      clearedRows: rowsToClear.length,
      rowsCleared: rowsToClear,
    };
  };
}

export default Board;
