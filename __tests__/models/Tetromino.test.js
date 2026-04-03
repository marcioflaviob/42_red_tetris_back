import { Tetromino } from '../../models/Tetromino.js';
import { SHAPES, SPAWN_CELL_COL, BOARD_COLS, BOARD_ROWS, BUFFER_ZONE_ROWS, MOVES, COLLISION } from '../../models/constants.js';
import seedrandom from 'seedrandom';

const TOTAL_ROWS = BUFFER_ZONE_ROWS + BOARD_ROWS;
const emptyBoard = new Array(TOTAL_ROWS * BOARD_COLS).fill(0);

describe('Tetromino', () => {
  describe('constructor', () => {
    it('uses provided shape', () => {
      const t = new Tetromino({ shape: SHAPES.T, color: 1 });
      expect(t.shape).toBe(SHAPES.T);
    });

    it('picks a random shape when none provided', () => {
      const rng = seedrandom('test');
      const t = new Tetromino({ rng });
      expect(Object.values(SHAPES)).toContain(t.shape);
    });

    it('assigns color', () => {
      const t = new Tetromino({ shape: SHAPES.O, color: 5 });
      expect(t.color).toBe(5);
    });

    it('uses provided coords', () => {
      const coords = [[3, 3], [3, 4]];
      const t = new Tetromino({ shape: SHAPES.O, color: 1, coords });
      expect(t.coords).toBe(coords);
    });

    it('uses provided pivot', () => {
      const pivot = [0, 2];
      const t = new Tetromino({ shape: SHAPES.I, color: 1, pivot });
      expect(t.pivot).toBe(pivot);
    });

    it('defaults rotation to 0', () => {
      const t = new Tetromino({ shape: SHAPES.T, color: 1 });
      expect(t.rotation).toBe(0);
    });

    it('uses provided rotation', () => {
      const t = new Tetromino({ shape: SHAPES.T, color: 1, rotation: 2 });
      expect(t.rotation).toBe(2);
    });
  });

  describe('getInitialCoords', () => {
    it('spawns I piece at correct horizontal position', () => {
      const t = new Tetromino({ shape: SHAPES.I, color: 1 });
      expect(t.coords.length).toBe(4);
      t.coords.forEach(([r, c]) => {
        expect(r).toBe(0);
        expect(c).toBeGreaterThanOrEqual(SPAWN_CELL_COL);
      });
    });

    it('spawns T piece with 4 cells', () => {
      const t = new Tetromino({ shape: SHAPES.T, color: 1 });
      expect(t.coords.length).toBe(4);
    });

    it('spawns O piece with 4 cells', () => {
      const t = new Tetromino({ shape: SHAPES.O, color: 1 });
      expect(t.coords.length).toBe(4);
    });
  });

  describe('calculatePivot', () => {
    it('calculates pivot for I piece (1x4)', () => {
      const t = new Tetromino({ shape: SHAPES.I, color: 1 });
      expect(t.pivot).toEqual([0, 1]);
    });

    it('calculates pivot for I piece vertical (4x1)', () => {
      const shape = [[1], [1], [1], [1]];
      const t = new Tetromino({ shape, color: 1 });
      expect(t.pivot).toEqual([2, 0]);
    });

    it('calculates center pivot for T piece (2x3)', () => {
      const t = new Tetromino({ shape: SHAPES.T, color: 1 });
      expect(t.pivot).toEqual([1, 1]);
    });

    it('calculates pivot for O piece (2x2)', () => {
      const t = new Tetromino({ shape: SHAPES.O, color: 1 });
      expect(t.pivot).toEqual([1, 1]);
    });
  });

  describe('getPredictCoords', () => {
    it('returns empty array when no coords', () => {
      const t = new Tetromino({ shape: SHAPES.T, color: 1, coords: [] });
      expect(t.getPredictCoords(emptyBoard)).toEqual([]);
    });

    it('drops piece to bottom of empty board', () => {
      const t = new Tetromino({
        shape: SHAPES.I,
        color: 1,
        coords: [[2, 3], [2, 4], [2, 5], [2, 6]],
        pivot: [0, 1],
        rotation: 0,
      });
      const predicted = t.getPredictCoords(emptyBoard);
      // Should land at row TOTAL_ROWS - 1 = 21
      predicted.forEach(([r]) => {
        expect(r).toBe(TOTAL_ROWS - 1);
      });
    });

    it('stops above occupied cells', () => {
      const board = [...emptyBoard];
      // Fill row 10
      for (let c = 0; c < BOARD_COLS; c++) {
        board[10 * BOARD_COLS + c] = 1;
      }
      const t = new Tetromino({
        shape: SHAPES.I,
        color: 1,
        coords: [[2, 3], [2, 4], [2, 5], [2, 6]],
        pivot: [0, 1],
        rotation: 0,
      });
      const predicted = t.getPredictCoords(board);
      // Should land at row 9 (just above the filled row 10)
      predicted.forEach(([r]) => {
        expect(r).toBe(9);
      });
    });
  });
});
