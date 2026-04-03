import {
  rotateMatrixCW,
  rotateIndexCW,
  getTopLeftFromCoords,
  getPieceType,
  buildCoordsFromShapeAt,
  rotatePiece,
} from '../../models/rotationHelper.js';
import { SHAPES, BOARD_COLS, BOARD_ROWS, BUFFER_ZONE_ROWS } from '../../models/constants.js';
import { Tetromino } from '../../models/Tetromino.js';

const TOTAL_ROWS = BUFFER_ZONE_ROWS + BOARD_ROWS;
const emptyBoard = new Array(TOTAL_ROWS * BOARD_COLS).fill(0);

describe('rotateMatrixCW', () => {
  it('rotates a 1x4 matrix (I piece horizontal) to 4x1', () => {
    const matrix = [[1, 1, 1, 1]];
    const result = rotateMatrixCW(matrix);
    expect(result).toEqual([[1], [1], [1], [1]]);
  });

  it('rotates a 2x2 matrix (O piece)', () => {
    const matrix = [[1, 1], [1, 1]];
    const result = rotateMatrixCW(matrix);
    expect(result).toEqual([[1, 1], [1, 1]]);
  });

  it('rotates a 2x3 T piece shape', () => {
    const matrix = [[0, 1, 0], [1, 1, 1]];
    const result = rotateMatrixCW(matrix);
    expect(result.length).toBe(3);
    expect(result[0].length).toBe(2);
  });

  it('returns correct dimensions after rotation', () => {
    const matrix = [[1, 0], [1, 1], [0, 1]];
    const result = rotateMatrixCW(matrix);
    expect(result.length).toBe(2);
    expect(result[0].length).toBe(3);
  });
});

describe('rotateIndexCW', () => {
  it('rotates [0, 0] in a 3-row shape', () => {
    const result = rotateIndexCW([0, 0], 3);
    expect(result).toEqual([0, 2]);
  });

  it('rotates [1, 1] in a 3-row shape', () => {
    const result = rotateIndexCW([1, 1], 3);
    expect(result).toEqual([1, 1]);
  });

  it('rotates [0, 1] in a 2-row shape', () => {
    const result = rotateIndexCW([0, 1], 2);
    expect(result).toEqual([1, 1]);
  });
});

describe('getTopLeftFromCoords', () => {
  it('finds top-left from a set of coords', () => {
    const coords = [[3, 5], [3, 6], [4, 5], [4, 6]];
    expect(getTopLeftFromCoords(coords)).toEqual([3, 5]);
  });

  it('handles single coord', () => {
    expect(getTopLeftFromCoords([[7, 2]])).toEqual([7, 2]);
  });

  it('finds correct min row and col', () => {
    const coords = [[5, 3], [4, 7], [6, 2]];
    expect(getTopLeftFromCoords(coords)).toEqual([4, 2]);
  });
});

describe('getPieceType', () => {
  it('returns I for 1x4 shape', () => {
    expect(getPieceType([[1, 1, 1, 1]])).toBe('I');
  });

  it('returns I for 4x1 shape', () => {
    expect(getPieceType([[1], [1], [1], [1]])).toBe('I');
  });

  it('returns O for 2x2 shape', () => {
    expect(getPieceType([[1, 1], [1, 1]])).toBe('O');
  });

  it('returns JLSTZ for T shape', () => {
    expect(getPieceType([[0, 1, 0], [1, 1, 1]])).toBe('JLSTZ');
  });

  it('returns JLSTZ for L shape', () => {
    expect(getPieceType([[0, 0, 1], [1, 1, 1]])).toBe('JLSTZ');
  });
});

describe('buildCoordsFromShapeAt', () => {
  it('builds coords for T shape at [0, 0]', () => {
    const shape = [[0, 1, 0], [1, 1, 1]];
    const coords = buildCoordsFromShapeAt(shape, [0, 0]);
    expect(coords).toContainEqual([0, 1]);
    expect(coords).toContainEqual([1, 0]);
    expect(coords).toContainEqual([1, 1]);
    expect(coords).toContainEqual([1, 2]);
    expect(coords.length).toBe(4);
  });

  it('builds coords for I shape at [5, 3]', () => {
    const shape = [[1, 1, 1, 1]];
    const coords = buildCoordsFromShapeAt(shape, [5, 3]);
    expect(coords).toEqual([[5, 3], [5, 4], [5, 5], [5, 6]]);
  });
});

describe('rotatePiece', () => {
  it('returns null when piece is null', () => {
    expect(rotatePiece(null, emptyBoard)).toBeNull();
  });

  it('returns null when piece has no shape', () => {
    expect(rotatePiece({ shape: null }, emptyBoard)).toBeNull();
  });

  it('does not rotate O piece (same coords)', () => {
    const piece = new Tetromino({
      shape: SHAPES.O,
      color: 1,
      coords: [[5, 4], [5, 5], [6, 4], [6, 5]],
      pivot: [1, 1],
      rotation: 0,
    });
    const result = rotatePiece(piece, emptyBoard);
    expect(result).not.toBeNull();
    expect(result.rotation).toBe(0);
    expect(result.coords).toEqual(piece.coords);
  });

  it('rotates T piece clockwise', () => {
    const piece = new Tetromino({
      shape: SHAPES.T,
      color: 1,
      coords: [[5, 3], [5, 4], [5, 5], [6, 4]],
      pivot: [1, 1],
      rotation: 0,
    });
    const result = rotatePiece(piece, emptyBoard);
    expect(result).not.toBeNull();
    expect(result.rotation).toBe(1);
    expect(result.shape).not.toEqual(SHAPES.T);
  });

  it('cycles through 4 rotations and returns to original rotation index', () => {
    let piece = new Tetromino({
      shape: SHAPES.T,
      color: 1,
      coords: [[5, 3], [5, 4], [5, 5], [6, 4]],
      pivot: [1, 1],
      rotation: 0,
    });
    let result;
    for (let i = 0; i < 4; i++) {
      result = rotatePiece(piece, emptyBoard);
      if (result) {
        piece = new Tetromino({
          shape: result.shape,
          color: 1,
          coords: result.coords,
          pivot: result.pivot,
          rotation: result.rotation,
        });
      }
    }
    expect(piece.rotation).toBe(0);
  });

  it('rotates I piece clockwise', () => {
    const piece = new Tetromino({
      shape: SHAPES.I,
      color: 1,
      coords: [[5, 3], [5, 4], [5, 5], [5, 6]],
      pivot: [0, 1],
      rotation: 0,
    });
    const result = rotatePiece(piece, emptyBoard);
    expect(result).not.toBeNull();
    expect(result.rotation).toBe(1);
  });

  it('returns null when rotation is blocked on all kicks', () => {
    // Fill board so there's no room to rotate
    const blockedBoard = new Array(TOTAL_ROWS * BOARD_COLS).fill(1);
    // Clear only the piece's current cells
    const piece = new Tetromino({
      shape: SHAPES.T,
      color: 1,
      coords: [[5, 3], [5, 4], [5, 5], [6, 4]],
      pivot: [1, 1],
      rotation: 0,
    });
    piece.coords.forEach(([r, c]) => {
      blockedBoard[r * BOARD_COLS + c] = 0;
    });
    const result = rotatePiece(piece, blockedBoard);
    expect(result).toBeNull();
  });
});
