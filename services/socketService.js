import { Server } from 'socket.io';
import { ApiException } from '../utils/ApiException.js';

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
    try {
      const { sessionId, username } = socket.handshake?.auth || {};
      if (!sessionId || !username) {
        console.log('Error here, no username or sessionID');
        socket.emit('error', { message: 'Invalid authentication data' });
        return;
      }

      socket.sessionId = sessionId;
      socket.username = username;
      this.connectedUsers.set(sessionId, socket);

      socket.emit('authenticated', { sessionId, username });
      console.log(`User authenticated: ${username} (${sessionId})`);
    } catch {
      socket.emit('error', { message: 'Authentication failed' });
    }
    // Room events
    socket.on('join_room', (data) => this.handleJoinRoom(socket, data));

    // Disconnect
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  handleJoinRoom(room, user) {
    try {
      const socket = this.connectedUsers.get(user.sessionId);
      if (!socket || !socket.sessionId) {
        socket.emit('error', { message: 'Not authenticated' });
        throw new ApiException('User not connected', 400);
      }

      socket.join(room.id);
      socket.currentRoom = room.id;

      this.broadcastToRoom(room.id, 'room_update', {
        type: 'player_joined',
        room: room,
        player: user,
      });

      //   socket.emit('room_joined', { room });
    } catch (error) {
      console.error(error);
    }
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

  // Utility methods for broadcasting
  broadcastToRoom(roomId, event, data) {
    console.log(`Broadcasting to ${roomId} the message`, data);
    this.io.to(roomId).emit(event, data);
  }

  sendToUser(sessionId, event, data) {
    const socket = this.connectedUsers.get(sessionId);
    if (socket) {
      socket.emit(event, data);
    }
  }
}

export default new SocketService();
