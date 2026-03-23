import {
  BOARD_COLS,
  BOARD_ROWS,
  BUFFER_ZONE_ROWS,
  CLASS,
  COLLISION,
  COLOR,
  MOVES,
} from './constants.js';

export const getRandom = (array, rng = null) => {
  const random = rng || Math.random;
  const values = Object.values(array);
  const randomIndex = Math.floor(random() * values.length);
  return values[randomIndex];
};

export const hasCollided = (move, coords, board) => {
  if (!coords) return COLLISION.NO;

  for (const [r, c] of coords) {
    if (c < 0 || c >= BOARD_COLS) return COLLISION.CONTINUE;

    if (move === MOVES.DOWN) {
      // Bottom collision
      if (r >= BUFFER_ZONE_ROWS + BOARD_ROWS) return COLLISION.LOCK;

      // Cell collision
      if (getCell([r, c], board)) return COLLISION.LOCK;
    } else {
      if (r >= BUFFER_ZONE_ROWS + BOARD_ROWS || getCell([r, c], board))
        return COLLISION.CONTINUE;
    }
  }
  return COLLISION.NO;
};

export const getIndex = (coords) => {
  return coords[0] * BOARD_COLS + coords[1];
};

export const getCell = (coords, board) => {
  const idx = getIndex(coords);
  return board[idx];
};
