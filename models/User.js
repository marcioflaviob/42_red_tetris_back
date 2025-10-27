class User {
  constructor(options = {}) {
    this.sessionId = options.sessionId;
    this.username = options.username;
    this.avatar = options.avatar;
    this.host = options.host || false;
    this.score = null;
  }
}

export default User;
