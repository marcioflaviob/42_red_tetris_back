import moveValidationService from './moveValidationService.js';
import boardService from './boardService.js';
import roomService from './roomService.js';

class GameEventHandler {
  async handleGameAction(socket, data, socketService) {
    const eventType = data?.event;

    // Board events are handled separately
    if (eventType === 'board') {
      return this.handleBoardEvent(socket, data, socketService);
    }

    // All other events (active-piece, move, etc.) are treated as move actions
    return this.handleMove(socket, data, socketService);
  }

  async handleMove(socket, data, socketService) {
    try {
      moveValidationService.validateMoveRequest(data);
    } catch (error) {
      socket.emit('error', { message: error.message });
      return;
    }

    // Broadcast first — the frontend is authoritative for game state.
    // Backend board validation must never gate the broadcast; if the backend
    // board drifts (e.g. false game-over), moves would silently stop reaching
    // spectators while the player's game continues normally.
    const shortSessionId = socket.sessionId.slice(0, 8);
    console.log(`Player ${socket.username} (${shortSessionId}) made move: ${data.action} in room ${socket.currentRoom}`);
    socketService.userBroadcast(socket, shortSessionId, data);

    // Best-effort: keep backend board in sync for clear-row validation.
    // Errors here are non-fatal — they only affect backend state tracking.
    try {
      const board = boardService.getBoardForPlayer(socket.currentRoom, socket.sessionId);
      if (moveValidationService.canExecuteMove(board)) {
        const result = boardService.movePiece(socket.currentRoom, socket.sessionId, data.action);
        if (result.success) {
          socketService.serverBroadcast(socket.currentRoom, 'board', result.board);
        }
      }
    } catch (error) {
      console.error('Backend board sync error (non-fatal):', error.message);
    }
  }

  async handleBoardEvent(socket, data, socketService) {
    const action = data?.action;
    const boardActions = {
      'clear-row': () => this.handleClearRows(socket, data, socketService),
      'add-garbage': () => this.handleAddGarbage(socket, data, socketService),
      'board-sync': () => this.handleBoardSync(socket, data, socketService),
    };

    const actionHandler = boardActions[action];
    if (actionHandler) {
      await actionHandler();
    } else {
      socket.emit('error', { message: `Unknown board action: ${action}` });
    }
  }

  async handleClearRows(socket, data, socketService) {
    try {
      // Get board for player
      const board = boardService.getBoardForPlayer(socket.currentRoom, socket.sessionId);

      if (!moveValidationService.canExecuteMove(board)) {
        socket.emit('clear_rows_failed', {
          action: data.action,
          reason: 'Board not available or game over',
        });
        return;
      }

      // Validate request structure and requested rows against current board state
      moveValidationService.validateRowClearRequest(data, board);

      // Clear the rows
      const result = board.clearRows(data.rows);

      if (!result.success) {
        socket.emit('clear_rows_failed', {
          action: data.action,
          reason: result.reason,
          rows: data.rows,
        });
        return;
      }

      // Broadcast clear-row event so clients can apply row clear updates immediately
      const shortSessionId = socket.sessionId.slice(0, 8);
      socketService.userBroadcast(socket, shortSessionId, {
        event: 'board',
        action: 'clear-row',
        rows: result.rowsCleared,
      });

      // Keep dedicated clear-row event for clients listening directly on this channel
      socketService.serverBroadcast(socket.currentRoom, 'clear-row', {
        action: data.action,
        rows: result.rowsCleared,
        userId: socket.sessionId,
      });

      // Broadcast updated board state to all players in the room
      socketService.serverBroadcast(socket.currentRoom, 'board', board);

      // Confirm to the player who cleared the rows
      socket.emit('rows_cleared', {
        clearedRows: result.clearedRows,
        rows: result.rowsCleared,
      });
    } catch (error) {
      console.error('Clear rows error:', error);
      socket.emit('error', { message: error.message });
    }
  }

  handleAddGarbage(socket, data, socketService) {
    const { lines } = data || {};
    if (!lines || lines <= 0) return;

    // Keep the backend board in sync so subsequent clear-row validation is correct
    const board = boardService.getBoardForPlayer(socket.currentRoom, socket.sessionId);
    if (board) board.addGarbageRows(lines);

    // Relay to all room members so their OnlineGameCards can render the grey rows
    const shortSessionId = socket.sessionId.slice(0, 8);
    socketService.userBroadcast(socket, shortSessionId, {
      event: 'board',
      action: 'add-garbage',
      lines,
    });
  }

  handleGarbageSend(socket, data, socketService) {
    const { targetId, lines } = data || {};
    if (!targetId || !lines || lines <= 0) return;

    // Notify the target's own game so they see the pending bar fill up
    socketService.sendToUser(targetId, 'garbage-queued', { lines });

    // Notify the whole room so everyone sees the pending bar on the target's card
    if (socket.currentRoom) {
      socketService.serverBroadcast(socket.currentRoom, 'garbage-pending', { targetId, lines });
    }
  }

  handleBoardSync(socket, data, socketService) {
    const { board } = data || {};
    if (!Array.isArray(board)) return;

    // Replace backend board with the frontend's authoritative state.
    // Also reset gameOver in case drift caused a false positive.
    const backendBoard = boardService.getBoardForPlayer(socket.currentRoom, socket.sessionId);
    if (backendBoard) {
      backendBoard.board = [...board];
      backendBoard.gameOver = false;
    }

    // Relay snapshot to all spectators in the room
    const shortSessionId = socket.sessionId.slice(0, 8);
    socketService.userBroadcast(socket, shortSessionId, {
      event: 'board',
      action: 'board-sync',
      board,
    });
  }

  handlePlayerGameOver(socket, socketService) {
    if (!socket.currentRoom) return;

    roomService.eliminatePlayer(socket.currentRoom, socket.sessionId);

    socketService.serverBroadcast(socket.currentRoom, 'room_update', {
      type: 'player_eliminated',
      sessionId: socket.sessionId,
    });

    const activePlayers = roomService.getActivePlayers(socket.currentRoom);
    if (activePlayers.length <= 1) {
      const winner = activePlayers[0] || null;
      socketService.serverBroadcast(socket.currentRoom, 'room_update', {
        type: 'match_over',
        winner: winner ? { sessionId: winner.sessionId, username: winner.username } : null,
      });
    }
  }

  handleStartGame(socket, socketService) {
    if (!socket.currentRoom) {
      socket.emit('error', { message: 'You are not in a room' });
      return;
    }
    roomService.startRoom(socket.currentRoom);
    socketService.serverBroadcast(socket.currentRoom, 'room_update', {
      type: 'game_started',
      startedBy: socket.sessionId,
      startedAt: new Date().toISOString(),
    });
  }

  handlePlayerDisconnect(socket, socketService) {
    const room = roomService.rooms.get(socket.currentRoom);
    if (!room) return;

    if (room.startedAt) {
      // Game in progress: eliminate and gray out board for others
      roomService.eliminatePlayer(socket.currentRoom, socket.sessionId);

      socketService.serverBroadcast(socket.currentRoom, 'room_update', {
        type: 'player_disconnected',
        sessionId: socket.sessionId,
      });

      const activePlayers = roomService.getActivePlayers(socket.currentRoom);
      if (activePlayers.length <= 1) {
        const winner = activePlayers[0] || null;
        socketService.serverBroadcast(socket.currentRoom, 'room_update', {
          type: 'match_over',
          winner: winner ? { sessionId: winner.sessionId, username: winner.username } : null,
        });
      }
    } else {
      // Lobby: remove player, reassign host if needed
      const updatedRoom = roomService.removePlayer(socket.currentRoom, socket.sessionId);
      if (updatedRoom) {
        socketService.serverBroadcast(socket.currentRoom, 'room_update', {
          type: 'player_left',
          sessionId: socket.sessionId,
          players: updatedRoom.players,
        });
      }
    }
  }

  handlePlayAgain(socket, socketService) {
    if (!socket.currentRoom) return;
    try {
      const newRoom = roomService.createNextRoom(socket.currentRoom, socket.sessionId);
      // Broadcast to old room before anyone leaves — all clients will navigate to new URL
      socketService.serverBroadcast(socket.currentRoom, 'room_update', {
        type: 'new_room',
        roomId: newRoom.id,
      });
    } catch (error) {
      console.error('Play again error:', error);
      socket.emit('error', { message: error.message });
    }
  }

  handleJoinRoom(socket, data, socketService) {
    try {
      if (!socket.sessionId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      socket.join(data.roomId);
      socket.currentRoom = data.roomId;

      socketService.serverBroadcast(data.roomId, 'room_update', {
        type: 'player_joined',
        player: {
          sessionId: socket.sessionId,
          username: socket.username,
        },
      });
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: error.message });
    }
  }
}

export default new GameEventHandler();
