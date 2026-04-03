import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/boardService.js', () => ({
  default: {
    getBoardForPlayer: jest.fn(),
    movePiece: jest.fn(),
  },
}));

jest.unstable_mockModule('../../services/roomService.js', () => ({
  default: {
    eliminatePlayer: jest.fn(),
    getActivePlayers: jest.fn(),
    startRoom: jest.fn(),
    removePlayer: jest.fn(),
    rooms: new Map(),
    createNextRoom: jest.fn(),
  },
}));

jest.unstable_mockModule('../../services/moveValidationService.js', () => ({
  default: {
    validateMoveRequest: jest.fn(),
    canExecuteMove: jest.fn(),
    validateRowClearRequest: jest.fn(),
  },
}));

let gameEventHandler;
let boardService;
let roomService;
let moveValidationService;

beforeAll(async () => {
  ({ default: gameEventHandler } = await import('../../services/gameEventHandler.js'));
  ({ default: boardService } = await import('../../services/boardService.js'));
  ({ default: roomService } = await import('../../services/roomService.js'));
  ({ default: moveValidationService } = await import('../../services/moveValidationService.js'));
});

beforeEach(() => {
  jest.clearAllMocks();
  roomService.rooms.clear();
});

function makeSocket(overrides = {}) {
  return {
    sessionId: 'session-abc12345',
    username: 'testuser',
    currentRoom: 'room-xyz',
    emit: jest.fn(),
    join: jest.fn(),
    on: jest.fn(),
    ...overrides,
  };
}

function makeSocketService() {
  return {
    serverBroadcast: jest.fn(),
    userBroadcast: jest.fn(),
    sendToUser: jest.fn(),
  };
}

describe('GameEventHandler', () => {
  describe('handleGameAction', () => {
    it('routes board events to handleBoardEvent', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      boardService.getBoardForPlayer.mockReturnValue({ gameOver: false });
      moveValidationService.canExecuteMove.mockReturnValue(true);

      await gameEventHandler.handleGameAction(socket, { event: 'board', action: 'unknown-board' }, ss);
      expect(socket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ message: expect.any(String) }));
    });

    it('routes non-board events to handleMove', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      moveValidationService.validateMoveRequest.mockReturnValue(true);
      moveValidationService.canExecuteMove.mockReturnValue(false);

      await gameEventHandler.handleGameAction(socket, { event: 'move', action: 'move-down' }, ss);
      expect(moveValidationService.validateMoveRequest).toHaveBeenCalled();
    });
  });

  describe('handleMove', () => {
    it('emits error when validation fails', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      moveValidationService.validateMoveRequest.mockImplementation(() => {
        throw new Error('Invalid action');
      });

      await gameEventHandler.handleMove(socket, { action: 'jump' }, ss);
      expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Invalid action' });
    });

    it('broadcasts move to room', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      moveValidationService.validateMoveRequest.mockReturnValue(true);
      moveValidationService.canExecuteMove.mockReturnValue(false);

      await gameEventHandler.handleMove(socket, { action: 'move-down' }, ss);
      expect(ss.userBroadcast).toHaveBeenCalled();
    });

    it('syncs board on successful move', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const mockBoard = { gameOver: false };
      moveValidationService.validateMoveRequest.mockReturnValue(true);
      moveValidationService.canExecuteMove.mockReturnValue(true);
      boardService.getBoardForPlayer.mockReturnValue(mockBoard);
      boardService.movePiece.mockReturnValue({ success: true, board: mockBoard });

      await gameEventHandler.handleMove(socket, { action: 'move-down' }, ss);
      expect(boardService.movePiece).toHaveBeenCalled();
      expect(ss.serverBroadcast).toHaveBeenCalledWith(socket.currentRoom, 'board', mockBoard);
    });

    it('does not crash when getBoardForPlayer throws (non-fatal)', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      moveValidationService.validateMoveRequest.mockReturnValue(true);
      moveValidationService.canExecuteMove.mockReturnValue(true);
      boardService.getBoardForPlayer.mockImplementation(() => {
        throw new Error('Board error');
      });

      await expect(
        gameEventHandler.handleMove(socket, { action: 'move-down' }, ss)
      ).resolves.not.toThrow();
    });
  });

  describe('handleBoardEvent', () => {
    it('dispatches to handleClearRows for clear-row', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const mockBoard = {
        gameOver: false,
        clearRows: jest.fn(() => ({ success: true, clearedRows: 1, rowsCleared: [5] })),
      };
      moveValidationService.canExecuteMove.mockReturnValue(true);
      moveValidationService.validateRowClearRequest.mockReturnValue(true);
      boardService.getBoardForPlayer.mockReturnValue(mockBoard);

      await gameEventHandler.handleBoardEvent(socket, { action: 'clear-row', rows: [5] }, ss);
      expect(mockBoard.clearRows).toHaveBeenCalled();
    });

    it('dispatches to handleAddGarbage for add-garbage', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const mockBoard = { addGarbageRows: jest.fn() };
      boardService.getBoardForPlayer.mockReturnValue(mockBoard);

      await gameEventHandler.handleBoardEvent(socket, { action: 'add-garbage', lines: 2 }, ss);
      expect(mockBoard.addGarbageRows).toHaveBeenCalledWith(2);
    });

    it('dispatches to handleBoardSync for board-sync', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const mockBoard = { board: [], gameOver: true };
      boardService.getBoardForPlayer.mockReturnValue(mockBoard);

      await gameEventHandler.handleBoardEvent(socket, { action: 'board-sync', board: [1, 2, 3] }, ss);
      expect(mockBoard.board).toEqual([1, 2, 3]);
      expect(mockBoard.gameOver).toBe(false);
    });

    it('emits error for unknown board action', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();

      await gameEventHandler.handleBoardEvent(socket, { action: 'unknown' }, ss);
      expect(socket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ message: expect.stringContaining('unknown') }));
    });
  });

  describe('handleClearRows', () => {
    it('emits clear_rows_failed when board not available', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      moveValidationService.canExecuteMove.mockReturnValue(false);
      boardService.getBoardForPlayer.mockReturnValue(null);

      await gameEventHandler.handleClearRows(socket, { action: 'clear-row', rows: [5] }, ss);
      expect(socket.emit).toHaveBeenCalledWith('clear_rows_failed', expect.any(Object));
    });

    it('emits clear_rows_failed when clearRows fails', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const mockBoard = {
        gameOver: false,
        clearRows: jest.fn(() => ({ success: false, reason: 'Invalid rows' })),
      };
      moveValidationService.canExecuteMove.mockReturnValue(true);
      moveValidationService.validateRowClearRequest.mockReturnValue(true);
      boardService.getBoardForPlayer.mockReturnValue(mockBoard);

      await gameEventHandler.handleClearRows(socket, { action: 'clear-row', rows: [5] }, ss);
      expect(socket.emit).toHaveBeenCalledWith('clear_rows_failed', expect.any(Object));
    });

    it('broadcasts and confirms on success', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const mockBoard = {
        gameOver: false,
        clearRows: jest.fn(() => ({ success: true, clearedRows: 1, rowsCleared: [5] })),
      };
      moveValidationService.canExecuteMove.mockReturnValue(true);
      moveValidationService.validateRowClearRequest.mockReturnValue(true);
      boardService.getBoardForPlayer.mockReturnValue(mockBoard);

      await gameEventHandler.handleClearRows(socket, { action: 'clear-row', rows: [5] }, ss);
      expect(ss.userBroadcast).toHaveBeenCalled();
      expect(ss.serverBroadcast).toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith('rows_cleared', expect.any(Object));
    });

    it('emits error when validation throws', async () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const mockBoard = { gameOver: false };
      moveValidationService.canExecuteMove.mockReturnValue(true);
      moveValidationService.validateRowClearRequest.mockImplementation(() => {
        throw new Error('Validation failed');
      });
      boardService.getBoardForPlayer.mockReturnValue(mockBoard);

      await gameEventHandler.handleClearRows(socket, { action: 'clear-row', rows: [5] }, ss);
      expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Validation failed' });
    });
  });

  describe('handleAddGarbage', () => {
    it('does nothing when lines is 0 or missing', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      boardService.getBoardForPlayer.mockReturnValue({ addGarbageRows: jest.fn() });

      gameEventHandler.handleAddGarbage(socket, { lines: 0 }, ss);
      expect(ss.userBroadcast).not.toHaveBeenCalled();
    });

    it('does nothing when data is null', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      gameEventHandler.handleAddGarbage(socket, null, ss);
      expect(ss.userBroadcast).not.toHaveBeenCalled();
    });

    it('adds garbage and broadcasts', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const mockBoard = { addGarbageRows: jest.fn() };
      boardService.getBoardForPlayer.mockReturnValue(mockBoard);

      gameEventHandler.handleAddGarbage(socket, { lines: 3 }, ss);
      expect(mockBoard.addGarbageRows).toHaveBeenCalledWith(3);
      expect(ss.userBroadcast).toHaveBeenCalled();
    });
  });

  describe('handleGarbageSend', () => {
    it('does nothing when missing targetId or lines', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      gameEventHandler.handleGarbageSend(socket, { lines: 2 }, ss);
      expect(ss.sendToUser).not.toHaveBeenCalled();
    });

    it('sends garbage to target and broadcasts', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      gameEventHandler.handleGarbageSend(socket, { targetId: 'target-session', lines: 2 }, ss);
      expect(ss.sendToUser).toHaveBeenCalledWith('target-session', 'garbage-queued', { lines: 2 });
      expect(ss.serverBroadcast).toHaveBeenCalledWith(socket.currentRoom, 'garbage-pending', { targetId: 'target-session', lines: 2 });
    });
  });

  describe('handleBoardSync', () => {
    it('does nothing when board is not an array', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      gameEventHandler.handleBoardSync(socket, { board: 'not-array' }, ss);
      expect(ss.userBroadcast).not.toHaveBeenCalled();
    });

    it('syncs board and broadcasts', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const mockBackendBoard = { board: [], gameOver: true };
      boardService.getBoardForPlayer.mockReturnValue(mockBackendBoard);

      gameEventHandler.handleBoardSync(socket, { board: [1, 2, 3] }, ss);
      expect(mockBackendBoard.board).toEqual([1, 2, 3]);
      expect(mockBackendBoard.gameOver).toBe(false);
      expect(ss.userBroadcast).toHaveBeenCalled();
    });
  });

  describe('handlePlayerGameOver', () => {
    it('does nothing when socket has no currentRoom', () => {
      const socket = makeSocket({ currentRoom: null });
      const ss = makeSocketService();
      gameEventHandler.handlePlayerGameOver(socket, ss);
      expect(roomService.eliminatePlayer).not.toHaveBeenCalled();
    });

    it('eliminates player and broadcasts', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      roomService.getActivePlayers.mockReturnValue([{ sessionId: 'other', username: 'other' }, { sessionId: 'session-abc12345', username: 'me' }]);

      gameEventHandler.handlePlayerGameOver(socket, ss);
      expect(roomService.eliminatePlayer).toHaveBeenCalledWith(socket.currentRoom, socket.sessionId);
      expect(ss.serverBroadcast).toHaveBeenCalledWith(socket.currentRoom, 'room_update', expect.objectContaining({ type: 'player_eliminated' }));
    });

    it('broadcasts match_over when only 1 active player remains', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const winner = { sessionId: 'winner-session', username: 'winner' };
      roomService.getActivePlayers.mockReturnValue([winner]);

      gameEventHandler.handlePlayerGameOver(socket, ss);
      expect(ss.serverBroadcast).toHaveBeenCalledWith(socket.currentRoom, 'room_update', expect.objectContaining({ type: 'match_over' }));
    });

    it('broadcasts match_over with null winner when no players remain', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      roomService.getActivePlayers.mockReturnValue([]);

      gameEventHandler.handlePlayerGameOver(socket, ss);
      const matchOverCall = ss.serverBroadcast.mock.calls.find(
        ([, event, data]) => event === 'room_update' && data?.type === 'match_over'
      );
      const matchOverData = matchOverCall?.[2];
      expect(matchOverData?.winner).toBeNull();
    });
  });

  describe('handleStartGame', () => {
    it('emits error when not in a room', () => {
      const socket = makeSocket({ currentRoom: null });
      const ss = makeSocketService();
      gameEventHandler.handleStartGame(socket, ss);
      expect(socket.emit).toHaveBeenCalledWith('error', { message: 'You are not in a room' });
    });

    it('starts game and broadcasts game_started', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      gameEventHandler.handleStartGame(socket, ss);
      expect(roomService.startRoom).toHaveBeenCalledWith(socket.currentRoom);
      expect(ss.serverBroadcast).toHaveBeenCalledWith(socket.currentRoom, 'room_update', expect.objectContaining({ type: 'game_started' }));
    });
  });

  describe('handlePlayerDisconnect', () => {
    it('does nothing when room not found', () => {
      const socket = makeSocket({ currentRoom: 'nonexistent' });
      const ss = makeSocketService();
      // rooms map is empty, so get returns undefined
      gameEventHandler.handlePlayerDisconnect(socket, ss);
      expect(ss.serverBroadcast).not.toHaveBeenCalled();
    });

    it('eliminates player when game in progress', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const room = { startedAt: new Date().toISOString(), players: [] };
      roomService.rooms.set(socket.currentRoom, room);
      roomService.getActivePlayers.mockReturnValue([]);

      gameEventHandler.handlePlayerDisconnect(socket, ss);
      expect(roomService.eliminatePlayer).toHaveBeenCalled();
      expect(ss.serverBroadcast).toHaveBeenCalledWith(socket.currentRoom, 'room_update', expect.objectContaining({ type: 'player_disconnected' }));
    });

    it('removes player from lobby when game not started', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const room = { startedAt: null, players: [{ sessionId: socket.sessionId }] };
      roomService.rooms.set(socket.currentRoom, room);
      const updatedRoom = { players: [] };
      roomService.removePlayer.mockReturnValue(updatedRoom);

      gameEventHandler.handlePlayerDisconnect(socket, ss);
      expect(roomService.removePlayer).toHaveBeenCalledWith(socket.currentRoom, socket.sessionId);
      expect(ss.serverBroadcast).toHaveBeenCalledWith(socket.currentRoom, 'room_update', expect.objectContaining({ type: 'player_left' }));
    });

    it('does not broadcast when removePlayer returns null', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const room = { startedAt: null };
      roomService.rooms.set(socket.currentRoom, room);
      roomService.removePlayer.mockReturnValue(null);

      gameEventHandler.handlePlayerDisconnect(socket, ss);
      expect(ss.serverBroadcast).not.toHaveBeenCalled();
    });
  });

  describe('handlePlayAgain', () => {
    it('does nothing when no currentRoom', () => {
      const socket = makeSocket({ currentRoom: null });
      const ss = makeSocketService();
      gameEventHandler.handlePlayAgain(socket, ss);
      expect(roomService.createNextRoom).not.toHaveBeenCalled();
    });

    it('creates new room and broadcasts', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      const newRoom = { id: 'new-room-id' };
      roomService.createNextRoom.mockReturnValue(newRoom);

      gameEventHandler.handlePlayAgain(socket, ss);
      expect(roomService.createNextRoom).toHaveBeenCalledWith(socket.currentRoom, socket.sessionId);
      expect(ss.serverBroadcast).toHaveBeenCalledWith(socket.currentRoom, 'room_update', { type: 'new_room', roomId: 'new-room-id' });
    });

    it('emits error when createNextRoom throws', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      roomService.createNextRoom.mockImplementation(() => {
        throw new Error('Room not found');
      });

      gameEventHandler.handlePlayAgain(socket, ss);
      expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Room not found' });
    });
  });

  describe('handleJoinRoom', () => {
    it('emits error when not authenticated', () => {
      const socket = makeSocket({ sessionId: null });
      const ss = makeSocketService();
      gameEventHandler.handleJoinRoom(socket, { roomId: 'room-1' }, ss);
      expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Not authenticated' });
    });

    it('joins room and broadcasts player_joined', () => {
      const socket = makeSocket();
      const ss = makeSocketService();
      gameEventHandler.handleJoinRoom(socket, { roomId: 'room-1' }, ss);
      expect(socket.join).toHaveBeenCalledWith('room-1');
      expect(socket.currentRoom).toBe('room-1');
      expect(ss.serverBroadcast).toHaveBeenCalledWith('room-1', 'room_update', expect.objectContaining({ type: 'player_joined' }));
    });
  });
});
