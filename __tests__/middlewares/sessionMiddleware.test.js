import { jest } from '@jest/globals';
import sessionMiddleware from '../../middlewares/sessionMiddleware.js';

describe('sessionMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, body: {} };
    res = {};
    next = jest.fn();
  });

  it('calls next when no session id', () => {
    sessionMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('attaches sessionId to req.body.user when header present', () => {
    req.headers['x-session-id'] = 'abc-123';
    sessionMiddleware(req, res, next);
    expect(req.body.user.sessionId).toBe('abc-123');
    expect(next).toHaveBeenCalled();
  });

  it('initializes req.body when not present', () => {
    req.body = null;
    req.headers['x-session-id'] = 'abc-123';
    sessionMiddleware(req, res, next);
    expect(req.body.user.sessionId).toBe('abc-123');
  });

  it('initializes req.body.user when not present', () => {
    req.body = {};
    req.headers['x-session-id'] = 'abc-123';
    sessionMiddleware(req, res, next);
    expect(req.body.user.sessionId).toBe('abc-123');
  });

  it('preserves existing user fields when adding sessionId', () => {
    req.body = { user: { username: 'alice' } };
    req.headers['x-session-id'] = 'sess-999';
    sessionMiddleware(req, res, next);
    expect(req.body.user.username).toBe('alice');
    expect(req.body.user.sessionId).toBe('sess-999');
  });

  it('does not modify body when no sessionId header', () => {
    req.body = { user: { username: 'bob' } };
    sessionMiddleware(req, res, next);
    expect(req.body).toEqual({ user: { username: 'bob' } });
  });

  it('calls next even if an error occurs internally', () => {
    // Simulate error by making headers throw
    const badReq = {
      get headers() {
        throw new Error('Header error');
      },
    };
    sessionMiddleware(badReq, res, next);
    expect(next).toHaveBeenCalled();
  });
});
