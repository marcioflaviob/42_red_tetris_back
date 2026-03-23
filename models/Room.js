import dicewareService from '../services/dicewareService.js';

class Room {
  constructor(options = {}) {
    this.id = dicewareService.getTwoRandomWords();
    this.players = options.players || [];
    this.piecePrediction = options.piecePrediction;
    this.invisiblePieces = options.invisiblePieces;
    this.increasedGravity = options.increasedGravity;
    this.nextPieces = options.nextPieces;
    this.startedAt = null;
    this.endedAt = null;
    this.online = true;
  }
}

export default Room;
