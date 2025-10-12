import dicewareService from "../services/dicewareService.js";

class Room {
    constructor(options = {}) {
        this.id = dicewareService.getTwoRandomWords();
        this.players = options.players || [];
        this.invisiblePieces = options.invisiblePieces,
        this.increasedGravity = options.increasedGravity,
        this.startedAt = null;
        this.endedAt = null;
    }
}

export default Room;