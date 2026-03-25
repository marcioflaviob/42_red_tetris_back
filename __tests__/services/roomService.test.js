import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/boardService.js', () => ({
  default: {
    createBoard: jest.fn(() => ({ id: 'mock-board', gameOver: false })),
  },
}));

jest.unstable_mockModule('../../services/socketService.js', () => ({
  default: {
    handleJoinRoom: jest.fn(),
  },
}));

let roomService;
let boardService;
let socketService;

beforeAll(async () => {
  ({ default: roomService } = await import('../../services/roomService.js'));
  ({ default: boardService } = await import('../../services/boardService.js'));
  ({ default: socketService } = await import('../../services/socketService.js'));
});

beforeEach(() => {
  roomService.rooms.clear();
  jest.clearAllMocks();
});

const makeUserData = (overrides = {}) => ({
  sessionId: 'session-001',
  username: 'alice',
  avatar: 'avatar.png',
  ...overrides,
});

const makeRoomData = (overrides = {}) => ({
  invisiblePieces: false,
  increasedGravity: false,
  piecePrediction: true,
  ...overrides,
});

describe('RoomService', () => {
  describe('createRoom', () => {
    it('creates a room and adds it to the map', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      expect(room).toBeDefined();
      expect(room.players.length).toBe(1);
      expect(roomService.rooms.size).toBe(1);
    });

    it('sets the first player as host', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      expect(room.players[0].host).toBe(true);
    });

    it('applies room settings', () => {
      const room = roomService.createRoom(
        makeUserData(),
        { invisiblePieces: true, increasedGravity: true, piecePrediction: false }
      );
      expect(room.invisiblePieces).toBe(true);
      expect(room.increasedGravity).toBe(true);
      expect(room.piecePrediction).toBe(false);
    });

    it('calls boardService.createBoard', () => {
      roomService.createRoom(makeUserData(), makeRoomData());
      expect(boardService.createBoard).toHaveBeenCalled();
    });

    it('throws when userData is missing', () => {
      expect(() => roomService.createRoom(null, makeRoomData())).toThrow();
    });
  });

  describe('isUserInTheRoom', () => {
    it('returns falsy when room does not exist', () => {
      expect(roomService.isUserInTheRoom('session-001', 'non-existent')).toBeFalsy();
    });

    it('returns true when user is in the room', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      expect(roomService.isUserInTheRoom('session-001', room.id)).toBe(true);
    });

    it('returns false when user is not in the room', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      expect(roomService.isUserInTheRoom('other-session', room.id)).toBe(false);
    });
  });

  describe('joinRoom', () => {
    it('lets a new user join an existing room', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      const newUser = makeUserData({ sessionId: 'session-002', username: 'bob' });
      const result = roomService.joinRoom(newUser, room.id);
      expect(result.players.length).toBe(2);
      expect(socketService.handleJoinRoom).toHaveBeenCalled();
    });

    it('does not add same user twice', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      const sameUser = makeUserData();
      roomService.joinRoom(sameUser, room.id);
      expect(room.players.length).toBe(1);
    });

    it('throws when room not found', () => {
      expect(() => roomService.joinRoom(makeUserData(), 'nonexistent')).toThrow();
    });

    it('throws when game has already started', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      room.startedAt = new Date().toISOString();
      const newUser = makeUserData({ sessionId: 'session-002' });
      expect(() => roomService.joinRoom(newUser, room.id)).toThrow();
    });

    it('throws when room is full (5 players)', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      // Add 4 more players to reach max
      for (let i = 2; i <= 5; i++) {
        const user = makeUserData({ sessionId: `session-00${i}`, username: `user${i}` });
        room.players.push(user);
      }
      const newUser = makeUserData({ sessionId: 'session-006', username: 'extra' });
      expect(() => roomService.joinRoom(newUser, room.id)).toThrow();
    });
  });

  describe('getRoom', () => {
    it('returns the room when found', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      const found = roomService.getRoom(makeUserData(), room.id);
      expect(found.id).toBe(room.id);
    });

    it('throws 404 when room not found', () => {
      let caught;
      try {
        roomService.getRoom(makeUserData(), 'missing-room');
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeDefined();
      expect(caught.statusCode).toBe(404);
    });

    it('throws when game started and user not in room', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      room.startedAt = new Date().toISOString();
      const stranger = makeUserData({ sessionId: 'stranger' });
      expect(() => roomService.getRoom(stranger, room.id)).toThrow();
    });
  });

  describe('eliminatePlayer', () => {
    it('marks player as eliminated', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      roomService.eliminatePlayer(room.id, 'session-001');
      expect(room.players[0].eliminated).toBe(true);
    });

    it('does nothing when room does not exist', () => {
      expect(() => roomService.eliminatePlayer('nonexistent', 'session')).not.toThrow();
    });

    it('does nothing when player not found', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      expect(() => roomService.eliminatePlayer(room.id, 'other-session')).not.toThrow();
    });
  });

  describe('getActivePlayers', () => {
    it('returns empty array when room not found', () => {
      expect(roomService.getActivePlayers('nonexistent')).toEqual([]);
    });

    it('returns only non-eliminated players', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      room.players.push({ sessionId: 'session-002', eliminated: false });
      room.players[0].eliminated = true;
      const active = roomService.getActivePlayers(room.id);
      expect(active.length).toBe(1);
      expect(active[0].sessionId).toBe('session-002');
    });

    it('returns all players when none eliminated', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      const active = roomService.getActivePlayers(room.id);
      expect(active.length).toBe(1);
    });
  });

  describe('createNextRoom', () => {
    it('creates a new room with same settings', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      const newRoom = roomService.createNextRoom(room.id, 'session-001');
      expect(newRoom.players.length).toBe(room.players.length);
      expect(roomService.rooms.has(newRoom.id)).toBe(true);
    });

    it('resets player eliminated state', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      room.players[0].eliminated = true;
      const newRoom = roomService.createNextRoom(room.id, 'session-001');
      expect(newRoom.players[0].eliminated).toBe(false);
    });

    it('assigns host to the provided hostSessionId', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      room.players.push({ sessionId: 'session-002', username: 'bob', avatar: null });
      const newRoom = roomService.createNextRoom(room.id, 'session-002');
      const host = newRoom.players.find((p) => p.host);
      expect(host.sessionId).toBe('session-002');
    });

    it('throws when old room not found', () => {
      expect(() => roomService.createNextRoom('nonexistent', 'session-001')).toThrow();
    });
  });

  describe('startRoom', () => {
    it('sets startedAt on the room', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      roomService.startRoom(room.id);
      expect(room.startedAt).toBeTruthy();
    });

    it('does nothing when room not found', () => {
      expect(() => roomService.startRoom('nonexistent')).not.toThrow();
    });
  });

  describe('removePlayer', () => {
    it('removes the player from the room', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      room.players.push({ sessionId: 'session-002', username: 'bob', host: false });
      const updated = roomService.removePlayer(room.id, 'session-002');
      expect(updated.players.length).toBe(1);
    });

    it('returns null and deletes room when last player leaves', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      const result = roomService.removePlayer(room.id, 'session-001');
      expect(result).toBeNull();
      expect(roomService.rooms.has(room.id)).toBe(false);
    });

    it('reassigns host when host leaves', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      room.players.push({ sessionId: 'session-002', username: 'bob', host: false });
      roomService.removePlayer(room.id, 'session-001');
      expect(room.players[0].host).toBe(true);
    });

    it('returns null when room does not exist', () => {
      expect(roomService.removePlayer('nonexistent', 'session-001')).toBeNull();
    });
  });

  describe('roomExists', () => {
    it('returns the room when it exists', () => {
      const room = roomService.createRoom(makeUserData(), makeRoomData());
      expect(roomService.roomExists(room.id)).toBeTruthy();
    });

    it('returns undefined when room does not exist', () => {
      expect(roomService.roomExists('missing')).toBeFalsy();
    });
  });
});
