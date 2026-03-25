import User from '../../models/User.js';

describe('User', () => {
  it('creates user with all options', () => {
    const board = { id: 'board-1' };
    const user = new User({
      sessionId: 'session-123',
      username: 'testuser',
      avatar: 'avatar.png',
      host: true,
      board,
    });
    expect(user.sessionId).toBe('session-123');
    expect(user.username).toBe('testuser');
    expect(user.avatar).toBe('avatar.png');
    expect(user.host).toBe(true);
    expect(user.board).toBe(board);
    expect(user.score).toBeNull();
    expect(user.eliminated).toBe(false);
  });

  it('defaults host to false', () => {
    const user = new User({ sessionId: 'abc' });
    expect(user.host).toBe(false);
  });

  it('creates user with empty options', () => {
    const user = new User({});
    expect(user.sessionId).toBeUndefined();
    expect(user.username).toBeUndefined();
    expect(user.host).toBe(false);
    expect(user.eliminated).toBe(false);
    expect(user.score).toBeNull();
  });
});
