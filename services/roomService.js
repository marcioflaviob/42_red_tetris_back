import { setTimeout } from 'timers';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { ApiException } from '../utils/ApiException.js';
import socketService from './socketService.js';

class RoomService {
  rooms = new Map();

  async createRoom(userData, roomData) {
    if (!userData) throw new ApiException('User not defined', 400);

    // TODO: remove 3 second delay and async from the function
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user = new User({
      sessionId: userData.sessionId,
      username: userData.username,
      avatar: userData.avatar,
      host: true,
    });
    const room = new Room({
      players: [user],
      invisiblePieces: roomData.invisiblePieces,
      increasedGravity: roomData.increasedGravity,
    });

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

  roomExists(roomId) {
    return this.rooms.get(roomId);
  }
}

export default new RoomService();
