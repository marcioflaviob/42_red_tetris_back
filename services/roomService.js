import Room from "../models/Room.js";
import User from "../models/User.js";
import { ApiException } from "../utils/ApiException.js";
import dicewareService from "./dicewareService.js"

class RoomService {

    rooms = {};

    createRoom(userData, roomData) {
        if (!userData) throw new ApiException('User not defined', 400);
        const user = new User({
            id: userData.id,
            username: userData.username,
            host: true
        })
        const room = new Room({
            players: [user],
            invisiblePieces: roomData.invisiblePieces,
            increasedGravity: roomData.increasedGravity
        })

        this.rooms[room.id] = room;

        return room;
    }

    joinRoom(roomId, user) {
        const room = this.getRoom(roomId);

        if (room.startedAt) throw new ApiException('Match has already started', 400);

        if (room.players.some(player => player.sessionId === user.sessionId))
            throw new ApiException('Player already in the room', 400);
        
        room.players.push(user);
    }

    getRoom(roomId, user) {
        const room = this.rooms[roomId];
        if (!room) throw new ApiException('Room not found', 404);

        if (!room.players.some(player => player.sessionId === user.sessionId)) {
            // User cannot get information or join a match that has already started
            if (room.startedAt) throw new ApiException('Match has already started', 400);
            this.joinRoom(roomId, user);
        }

        return room;
    }


}

export default new RoomService();