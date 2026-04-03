import { jest } from '@jest/globals';
import { getRandom, hasCollided, getIndex, getCell } from '../../models/helper.js';
import { COLLISION, MOVES, BOARD_COLS, BOARD_ROWS, BUFFER_ZONE_ROWS } from '../../models/constants.js';

const TOTAL_ROWS = BUFFER_ZONE_ROWS + BOARD_ROWS;
const emptyBoard = new Array(TOTAL_ROWS * BOARD_COLS).fill(0);

describe('getRandom', () => {
  it('returns a value from the object without rng', () => {
    const obj = { A: 1, B: 2, C: 3 };
    const result = getRandom(obj);
    expect(Object.values(obj)).toContain(result);
  });

  it('returns first value when rng returns 0', () => {
    const obj = { A: 10, B: 20, C: 30 };
    const mockRng = jest.fn(() => 0);
    const result = getRandom(obj, mockRng);
    expect(result).toBe(10);
    expect(mockRng).toHaveBeenCalled();
  });

  it('returns last value when rng returns just under 1', () => {
    const obj = { A: 10, B: 20, C: 30 };
    const mockRng = jest.fn(() => 0.99);
    const result = getRandom(obj, mockRng);
    expect(result).toBe(30);
  });
});

describe('getIndex', () => {
  it('returns 0 for [0, 0]', () => {
    expect(getIndex([0, 0])).toBe(0);
  });

  it('calculates correct index for row 1', () => {
    expect(getIndex([1, 0])).toBe(BOARD_COLS);
  });

  it('calculates correct index for arbitrary coords', () => {
    expect(getIndex([2, 3])).toBe(2 * BOARD_COLS + 3);
  });
});

describe('getCell', () => {
  it('returns 0 for empty cell', () => {
    expect(getCell([0, 0], emptyBoard)).toBe(0);
  });

  it('returns cell value at given coords', () => {
    const board = [...emptyBoard];
    board[5 * BOARD_COLS + 3] = 7;
    expect(getCell([5, 3], board)).toBe(7);
  });
});

describe('hasCollided', () => {
  it('returns NO when no collision', () => {
    const coords = [[5, 5]];
    expect(hasCollided(MOVES.DOWN, coords, emptyBoard)).toBe(COLLISION.NO);
  });

  it('returns NO when coords is null', () => {
    expect(hasCollided(MOVES.DOWN, null, emptyBoard)).toBe(COLLISION.NO);
  });

  it('returns CONTINUE when column is negative (LEFT out of bounds)', () => {
    const coords = [[5, -1]];
    expect(hasCollided(MOVES.LEFT, coords, emptyBoard)).toBe(COLLISION.CONTINUE);
  });

  it('returns CONTINUE when column >= BOARD_COLS (RIGHT out of bounds)', () => {
    const coords = [[5, BOARD_COLS]];
    expect(hasCollided(MOVES.RIGHT, coords, emptyBoard)).toBe(COLLISION.CONTINUE);
  });

  it('returns LOCK when moving DOWN and row >= total rows (floor)', () => {
    const coords = [[TOTAL_ROWS, 5]];
    expect(hasCollided(MOVES.DOWN, coords, emptyBoard)).toBe(COLLISION.LOCK);
  });

  it('returns LOCK when moving DOWN into occupied cell', () => {
    const board = [...emptyBoard];
    board[5 * BOARD_COLS + 5] = 1;
    const coords = [[5, 5]];
    expect(hasCollided(MOVES.DOWN, coords, board)).toBe(COLLISION.LOCK);
  });

  it('returns CONTINUE when moving LEFT/RIGHT into occupied cell', () => {
    const board = [...emptyBoard];
    board[5 * BOARD_COLS + 5] = 1;
    const coords = [[5, 5]];
    expect(hasCollided(MOVES.LEFT, coords, board)).toBe(COLLISION.CONTINUE);
  });

  it('returns CONTINUE for non-DOWN move when row >= total rows', () => {
    const coords = [[TOTAL_ROWS, 5]];
    expect(hasCollided(MOVES.LEFT, coords, emptyBoard)).toBe(COLLISION.CONTINUE);
  });

  it('returns NO for multiple coords with no collision', () => {
    const coords = [[3, 3], [3, 4], [3, 5], [3, 6]];
    expect(hasCollided(MOVES.DOWN, coords, emptyBoard)).toBe(COLLISION.NO);
  });
});
