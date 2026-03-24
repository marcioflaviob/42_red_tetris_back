class User {
  constructor(options = {}) {
    this.sessionId = options.sessionId;
    this.username = options.username;
    this.avatar = options.avatar;
    this.host = options.host || false;
    this.board = options.board;
    this.score = null;
  }
}

export default User;
