import { COLLISION, MOVES } from './constants.js';
import { hasCollided } from './helper.js';

const JLSTZ_KICKS = {
  '0>1': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  '1>2': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  '2>3': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  '3>0': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
};

const I_KICKS = {
  '0>1': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  '1>2': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  '2>3': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  '3>0': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
};

export const rotateMatrixCW = (matrix) => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const res = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      res[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return res;
};

export const rotateIndexCW = ([r, c], rows) => {
  return [c, rows - 1 - r];
};

export const getTopLeftFromCoords = (coords) => {
  let minR = Infinity;
  let minC = Infinity;
  for (const [r, c] of coords) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
  }
  return [minR, minC];
};

export const getPieceType = (shape) => {
  const rows = shape.length;
  const cols = shape[0].length;
  if ((rows === 1 && cols === 4) || (rows === 4 && cols === 1)) return 'I';
  if (rows === 2 && cols === 2) return 'O';
  return 'JLSTZ';
};

export const buildCoordsFromShapeAt = (shape, topLeft) => {
  const [baseR, baseC] = topLeft;
  const coords = [];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c]) coords.push([baseR + r, baseC + c]);
    }
  }
  return coords;
};

export const rotatePiece = (piece, board) => {
  if (!piece || !piece.shape) return null;

  const from = piece.rotation ?? 0;
  const to = (from + 1) % 4;
  const type = getPieceType(piece.shape);

  // O piece doesn't rotate
  if (type === 'O') {
    return {
      coords: piece.coords,
      shape: piece.shape,
      pivot: piece.pivot,
      rotation: from,
    };
  }

  const rows = piece.shape.length;

  const [topR, topC] = getTopLeftFromCoords(piece.coords);
  const pivotAbs = [topR + piece.pivot[0], topC + piece.pivot[1]];

  const rotatedShape = rotateMatrixCW(piece.shape);
  const newPivotIdx = rotateIndexCW(piece.pivot, rows);

  const baseTopLeft = [pivotAbs[0] - newPivotIdx[0], pivotAbs[1] - newPivotIdx[1]];

  const key = `${from}>${to}`;
  const kicks = type === 'I' ? I_KICKS[key] : JLSTZ_KICKS[key];

  for (const [dx, dy] of kicks) {
    const candidateTopLeft = [baseTopLeft[0] + dy, baseTopLeft[1] + dx];
    const candidateCoords = buildCoordsFromShapeAt(rotatedShape, candidateTopLeft);
    if (hasCollided(MOVES.ROTATE, candidateCoords, board) === COLLISION.NO) {
      return {
        coords: candidateCoords,
        shape: rotatedShape,
        pivot: newPivotIdx,
        rotation: to,
      };
    }
  }
  return null;
};
