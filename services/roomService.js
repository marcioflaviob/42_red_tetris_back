import Room from '../models/Room.js';
import User from '../models/User.js';
import { ApiException } from '../utils/ApiException.js';
import boardService from './boardService.js';
import socketService from './socketService.js';

class RoomService {
  rooms = new Map();

  createRoom(userData, roomData) {
    if (!userData) throw new ApiException('User not defined', 400);

    const room = new Room({
      invisiblePieces: roomData.invisiblePieces,
      increasedGravity: roomData.increasedGravity,
      piecePrediction: roomData.piecePrediction,
    });

    const user = new User({
      sessionId: userData.sessionId,
      username: userData.username,
      avatar: userData.avatar,
      host: true,
      board: boardService.createBoard(room.id),
    });

    room.players.push(user);

    this.rooms.set(room.id, room);

    return room;
  }

  isUserInTheRoom(sessionId, roomId) {
    const room = this.rooms.get(roomId);
    return room?.players?.some((player) => player.sessionId === sessionId);
  }

  joinRoom(user, roomId) {
    const room = this.getRoom(user, roomId);

    if (room.startedAt)
      throw new ApiException('Match has already started', 400);

    if (!this.isUserInTheRoom(user.sessionId, roomId)) {
      if (room.players.length >= 5)
        throw new ApiException('Match is full', 400);
      
      // Create a board for the joining player
      user.board = boardService.createBoard(room.id);
      room.players.push(user);
    }

    socketService.handleJoinRoom(room, user);

    return room;
  }

  getRoom(user, roomId) {
    const room = this.rooms.get(roomId);
    if (!room) throw new ApiException('Room not found', 404);

    if (!this.isUserInTheRoom(user.sessionId, roomId)) {
      if (room.startedAt)
        throw new ApiException('You are not part of this match', 400);
    }

    return room;
  }

  eliminatePlayer(roomId, sessionId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.sessionId === sessionId);
    if (player) player.eliminated = true;
  }

  getActivePlayers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return room.players.filter((p) => !p.eliminated);
  }

  // Creates a new room with a fresh ID/seed but the same settings and players.
  // Called on "play again" — gives every player a new board and resets elimination state.
  createNextRoom(oldRoomId, hostSessionId) {
    const oldRoom = this.rooms.get(oldRoomId);
    if (!oldRoom) throw new ApiException('Room not found', 404);

    const newRoom = new Room({
      invisiblePieces: oldRoom.invisiblePieces,
      increasedGravity: oldRoom.increasedGravity,
      piecePrediction: oldRoom.piecePrediction,
    });

    oldRoom.players.forEach((oldPlayer) => {
      const newUser = new User({
        sessionId: oldPlayer.sessionId,
        username: oldPlayer.username,
        avatar: oldPlayer.avatar,
        host: oldPlayer.sessionId === hostSessionId,
        board: boardService.createBoard(newRoom.id),
      });
      newRoom.players.push(newUser);
    });

    this.rooms.set(newRoom.id, newRoom);
    return newRoom;
  }

  startRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.startedAt = new Date().toISOString();
  }

  removePlayer(roomId, sessionId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const wasHost = room.players.find((p) => p.sessionId === sessionId)?.host;
    room.players = room.players.filter((p) => p.sessionId !== sessionId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    if (wasHost) {
      room.players[0].host = true;
    }

    return room;
  }

  roomExists(roomId) {
    return this.rooms.get(roomId);
  }
}

export default new RoomService();
