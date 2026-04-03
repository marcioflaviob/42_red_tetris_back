const sessionMiddleware = (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];

    if (sessionId) {
      if (!req.body) {
        req.body = {};
      }

      if (!req.body.user) {
        req.body.user = {};
      }

      req.body.user.sessionId = sessionId;
    }

    next();
  } catch (error) {
    console.error('Error in sessionMiddleware:', error);
    next();
  }
};

export default sessionMiddleware;
