import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/roomService.js', () => ({
  default: {
    getRoom: jest.fn(),
    rooms: new Map(),
  },
}));

let boardService;
let roomService;

beforeAll(async () => {
  ({ default: boardService } = await import('../../services/boardService.js'));
  ({ default: roomService } = await import('../../services/roomService.js'));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BoardService', () => {
  describe('createBoard', () => {
    it('returns null when no seed', () => {
      expect(boardService.createBoard(null)).toBeNull();
      expect(boardService.createBoard(undefined)).toBeNull();
      expect(boardService.createBoard('')).toBeNull();
    });

    it('returns a board with a seed', () => {
      const board = boardService.createBoard('test-seed');
      expect(board).not.toBeNull();
      expect(board.board).toBeDefined();
      expect(Array.isArray(board.board)).toBe(true);
    });

    it('returns board with an active piece spawned', () => {
      const board = boardService.createBoard('seed-1');
      expect(board.activePiece).not.toBeNull();
    });

    it('returns board with nextPieces populated', () => {
      const board = boardService.createBoard('seed-2');
      expect(board.nextPieces.length).toBeGreaterThan(0);
    });
  });

  describe('getBoardForPlayer', () => {
    it('returns null when room not found', () => {
      roomService.getRoom.mockImplementation(() => {
        throw new Error('Room not found');
      });
      // getBoardForPlayer throws if getRoom throws — this is caught upstream
      expect(() => boardService.getBoardForPlayer('room-1', 'session-1')).toThrow();
    });

    it('returns the player board', () => {
      const mockBoard = { gameOver: false };
      const mockRoom = {
        players: [
          { sessionId: 'session-1', board: mockBoard },
        ],
      };
      roomService.getRoom.mockReturnValue(mockRoom);
      const board = boardService.getBoardForPlayer('room-1', 'session-1');
      expect(board).toBe(mockBoard);
    });

    it('returns undefined when player not in room', () => {
      const mockRoom = {
        players: [{ sessionId: 'other-session', board: {} }],
      };
      roomService.getRoom.mockReturnValue(mockRoom);
      const board = boardService.getBoardForPlayer('room-1', 'session-1');
      expect(board).toBeUndefined();
    });
  });

  describe('movePiece', () => {
    it('throws when room not found', () => {
      roomService.getRoom.mockImplementation(() => {
        throw new Error('Room not found');
      });
      expect(() => boardService.movePiece('room-1', 'session-1', 'move-down')).toThrow('Room not found');
    });

    it('returns failure when board is null (player has no board)', () => {
      const mockRoom = {
        players: [{ sessionId: 'session-1', board: null }],
      };
      roomService.getRoom.mockReturnValue(mockRoom);
      const result = boardService.movePiece('room-1', 'session-1', 'move-down');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Board not found');
    });

    it('returns failure when game is over', () => {
      const mockBoard = { gameOver: true };
      const mockRoom = { players: [{ sessionId: 'session-1', board: mockBoard }] };
      roomService.getRoom.mockReturnValue(mockRoom);
      const result = boardService.movePiece('room-1', 'session-1', 'move-down');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Game over');
    });

    it('executes move-down action', () => {
      const board = boardService.createBoard('move-test-seed');
      const mockRoom = { players: [{ sessionId: 'session-1', board }] };
      roomService.getRoom.mockReturnValue(mockRoom);
      const result = boardService.movePiece('room-1', 'session-1', 'move-down');
      expect(result.success).toBe(true);
    });

    it('executes save action', () => {
      const board = boardService.createBoard('save-test-seed');
      const mockRoom = { players: [{ sessionId: 'session-1', board }] };
      roomService.getRoom.mockReturnValue(mockRoom);
      const result = boardService.movePiece('room-1', 'session-1', 'save');
      expect(result.success).toBe(true);
    });

    it('executes hard-drop action', () => {
      const board = boardService.createBoard('hard-drop-seed');
      const mockRoom = { players: [{ sessionId: 'session-1', board }] };
      roomService.getRoom.mockReturnValue(mockRoom);
      const result = boardService.movePiece('room-1', 'session-1', 'hard-drop');
      expect(result.success).toBe(true);
    });

    it('executes soft-drop action', () => {
      const board = boardService.createBoard('soft-drop-seed');
      const mockRoom = { players: [{ sessionId: 'session-1', board }] };
      roomService.getRoom.mockReturnValue(mockRoom);
      const result = boardService.movePiece('room-1', 'session-1', 'soft-drop');
      expect(result.success).toBe(true);
    });

    it('returns failure for unknown action', () => {
      const board = boardService.createBoard('unknown-action-seed');
      const mockRoom = { players: [{ sessionId: 'session-1', board }] };
      roomService.getRoom.mockReturnValue(mockRoom);
      const result = boardService.movePiece('room-1', 'session-1', 'jump');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Unknown action');
    });

    it('executes rotate action', () => {
      const board = boardService.createBoard('rotate-seed');
      const mockRoom = { players: [{ sessionId: 'session-1', board }] };
      roomService.getRoom.mockReturnValue(mockRoom);
      const result = boardService.movePiece('room-1', 'session-1', 'rotate');
      expect(result.success).toBe(true);
    });

    it('executes move-left action', () => {
      const board = boardService.createBoard('left-seed');
      const mockRoom = { players: [{ sessionId: 'session-1', board }] };
      roomService.getRoom.mockReturnValue(mockRoom);
      const result = boardService.movePiece('room-1', 'session-1', 'move-left');
      expect(result.success).toBe(true);
    });

    it('executes move-right action', () => {
      const board = boardService.createBoard('right-seed');
      const mockRoom = { players: [{ sessionId: 'session-1', board }] };
      roomService.getRoom.mockReturnValue(mockRoom);
      const result = boardService.movePiece('room-1', 'session-1', 'move-right');
      expect(result.success).toBe(true);
    });
  });
});
