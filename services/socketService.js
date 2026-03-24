import { Server } from 'socket.io';
import gameEventHandler from './gameEventHandler.js';

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // sessionId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'X-Session-Id'],
      },
    });

    console.log('Websocket server created');

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    // Authenticate
    if (!this.authenticateSocket(socket)) {
      return;
    }

    // Register event handlers
    this.registerEventHandlers(socket);

    // Handle disconnect
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  authenticateSocket(socket) {
    try {
      const { sessionId, username } = socket.handshake?.auth || {};
      if (!sessionId || !username) {
        console.log('Error here, no username or sessionID');
        socket.emit('error', { message: 'Invalid authentication data' });
        return false;
      }

      socket.sessionId = sessionId;
      socket.username = username;
      this.connectedUsers.set(sessionId, socket);

      socket.emit('authenticated', { sessionId, username });
      console.log(`✓ User authenticated: ${username} (${sessionId.slice(0, 8)})`);
      return true;
    } catch {
      socket.emit('error', { message: 'Authentication failed' });
      return false;
    }
  }

  registerEventHandlers(socket) {
    // Room events
    socket.on('join_room', (data) => gameEventHandler.handleJoinRoom(socket, data, this));
    socket.on('start_game', () => {
      if (!socket.currentRoom) {
        socket.emit('error', { message: 'You are not in a room' });
        return;
      }

      this.serverBroadcast(socket.currentRoom, 'room_update', {
        type: 'game_started',
        startedBy: socket.sessionId,
        startedAt: new Date().toISOString(),
      });
    });

    const shortSessionId = socket.sessionId.slice(0, 8);
    console.log(`Registering event handler on socket ${shortSessionId} for user ${socket.username}`);
    socket.on(shortSessionId, (data) => {
      console.log(`✓ Backend received event on ${shortSessionId}:`, data);
      gameEventHandler.handleGameAction(socket, data, this);
    });

    // Board events (like clear-row)
    socket.on('board', (data) => gameEventHandler.handleBoardEvent(socket, data, this));

    // Garbage queue: route garbage lines to a target player
    socket.on('send-garbage', (data) => gameEventHandler.handleGarbageSend(socket, data, this));
  }

  handleDisconnect(socket) {
    console.log('User disconnected:', socket.id);

    if (socket.sessionId) {
      this.connectedUsers.delete(socket.sessionId);

      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('room_updated', {
          type: 'player_disconnected',
          sessionId: socket.sessionId,
        });
      }
    }
  }

  handleJoinRoom(room, user) {
    const socket = this.connectedUsers.get(user.sessionId);
    if (!socket) {
      console.error('Socket not found for user:', user.sessionId);
      return;
    }

    socket.join(room.id);
    socket.currentRoom = room.id;
    console.log(`✓ Socket joined room. User: ${socket.username} (${socket.sessionId}), Room: ${room.id}, currentRoom set to: ${socket.currentRoom}`);

    this.serverBroadcast(room.id, 'room_update', {
      type: 'player_joined',
      room: room,
      player: user,
    });
  }

  // Utility methods for broadcasting
  serverBroadcast(roomId, event, data) {
    // console.log(`Broadcasting to ${roomId} the message`, data);
    this.io.to(roomId).emit(event, data);
  }

  userBroadcast(socket, event, data) {
    console.log(`Broadcasting to ${socket.currentRoom} on event ${event}:`, data);
    if (!socket.currentRoom) {
      console.error(`ERROR: socket.currentRoom not set for user ${socket.sessionId}`);
      return;
    }
    this.io.to(socket.currentRoom).emit(event, {
      userId: socket.sessionId,
      ...data,
    });
  }

  sendToUser(sessionId, event, data) {
    const socket = this.connectedUsers.get(sessionId);
    if (socket) {
      socket.emit(event, data);
    }
  }
}

export default new SocketService();
