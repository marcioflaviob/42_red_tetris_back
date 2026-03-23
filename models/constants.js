export const USERNAME_REGEX = /^[a-zA-Z0-9]*$/;

export const MOVE_DELAY = 100;
export const GRAVITY_DELAY = 1000;
export const FRAMES_PER_SECOND = 60;

export const BUFFER_ZONE_ROWS = 2;
export const BOARD_ROWS = 20;
export const BOARD_COLS = 10;
export const SPAWN_CELL_COL = 3;

export const MOVES = {
  DOWN: 'move-down',
  LEFT: 'move-left',
  RIGHT: 'move-right',
  ROTATE: 'rotate',
  SAVE: 'save',
  SOFT_DROP: 'soft-drop',
  HARD_DROP: 'hard-drop',
};

export const COLLISION = {
  NO: 0,
  CONTINUE: 1,
  LOCK: 2,
};

export const CLASS = {
  TILE: 1,
  PREDICT: 2,
  EMPTY: 0,
};

export const SCORED_ACTION = {
  SOFT_DROP: 1,
  HARD_DROP: 2,
  TETRIS: 3,
  TETRIS_B2B: 4,
};

export const SCORE = {
  SOFT_DROP: 1,
  HARD_DROP: 2,
  SINGLE: 10,
  DOUBLE: 30,
  TRIPLE: 50,
  TETRIS: 100,
  TETRIS_B2B: 120,
};

export const COLOR = {
  PURPLE: 1,
  MUSTARD: 2,
  PANTHER: 3,
  WINE: 4,
  GRASS: 5,
  ROYAL: 6,
  TURK: 7,
};

export const LEVEL = {
  1: 3, // Lines to be cleared to move to the next level
  2: 5,
  3: 7,
  4: 10,
  5: 15,
  6: 30,
  7: 35,
  8: 40,
  9: 45,
  10: 50,
  11: 55,
  12: 60,
  13: 65,
  14: 70,
  15: 999,
};

export const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};
