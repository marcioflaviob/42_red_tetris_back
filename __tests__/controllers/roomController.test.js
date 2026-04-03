import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/roomService.js', () => ({
  default: {
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
  },
}));

let createRoom, joinRoom;
let roomService;

beforeAll(async () => {
  ({ createRoom, joinRoom } = await import('../../controllers/roomController.js'));
  ({ default: roomService } = await import('../../services/roomService.js'));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('roomController', () => {
  describe('createRoom', () => {
    it('calls roomService.createRoom and returns result', async () => {
      const mockRoom = { id: 'room-123', players: [] };
      roomService.createRoom.mockResolvedValue(mockRoom);

      const req = { body: { user: { sessionId: 'sess-1', username: 'alice' }, room: {} } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await createRoom(req, res, next);
      expect(roomService.createRoom).toHaveBeenCalledWith(req.body.user, req.body.room);
      expect(res.json).toHaveBeenCalledWith(mockRoom);
    });

    it('calls next with error on failure', async () => {
      const error = new Error('Create failed');
      roomService.createRoom.mockRejectedValue(error);

      const req = { body: { user: {}, room: {} } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await createRoom(req, res, next);
      await Promise.resolve(); // flush microtask queue so .catch(next) runs
      expect(next).toHaveBeenCalledWith(error);
    });

    it('handles missing body gracefully', async () => {
      roomService.createRoom.mockResolvedValue({ id: 'room-1' });

      const req = { body: {} };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await createRoom(req, res, next);
      expect(roomService.createRoom).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('joinRoom', () => {
    it('calls roomService.joinRoom and returns result', async () => {
      const mockRoom = { id: 'room-456', players: [] };
      roomService.joinRoom.mockReturnValue(mockRoom);

      const req = {
        body: { user: { sessionId: 'sess-2', username: 'bob' } },
        params: { roomId: 'room-456' },
      };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await joinRoom(req, res, next);
      expect(roomService.joinRoom).toHaveBeenCalledWith(req.body.user, 'room-456');
      expect(res.json).toHaveBeenCalledWith(mockRoom);
    });

    it('calls next with error on failure', async () => {
      const error = new Error('Room not found');
      roomService.joinRoom.mockImplementation(() => {
        throw error;
      });

      const req = {
        body: { user: { sessionId: 'sess-2' } },
        params: { roomId: 'nonexistent' },
      };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await joinRoom(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
