import {
  COLOR,
  SPAWN_CELL_COL,
  MOVES,
  COLLISION,
  SHAPES,
} from './constants.js';
import { getRandom, hasCollided } from './helper.js';

export class Tetromino {
  constructor({
    shape = null,
    color = null,
    coords = null, // Array of tuples ex: [[0, 2], [1, 9]]
    pivot = null,
    rng = null,
    rotation = 0,
  }) {
    this.shape = shape || getRandom(SHAPES, rng);
    this.color = color;
    this.coords = coords || this.getInitialCoords();
    this.pivot = pivot || this.calculatePivot();
    this.rotation = rotation;
  }

  getInitialCoords() {
    let coords = [];
    this.shape?.map((row, rowIdx) =>
      row?.map((cell, cellIdx) => {
        if (cell) coords.push([rowIdx, SPAWN_CELL_COL + cellIdx]);
      })
    );
    return coords;
  }

  calculatePivot() {
    const rows = this.shape.length;
    const cols = this.shape[0].length;

    if ((rows === 1 && cols === 4) || (rows === 4 && cols === 1)) {
      if (rows === 1) return [0, 1];
      if (cols === 1) return [2, 0];
    }

    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);
    return [centerRow, centerCol];
  }

  getPredictCoords(board) {
    if (!this.coords || !this.coords.length) return [];

    let prediction = this.coords.map(([r, c]) => [r, c]);

    while (true) {
      const next = prediction.map(([r, c]) => [r + 1, c]);
      const collision = hasCollided(MOVES.DOWN, next, board);

      if (collision === COLLISION.LOCK || collision === COLLISION.CONTINUE)
        break;

      prediction = next;
    }

    return prediction;
  }
}
