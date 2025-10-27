import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import routes from './routes/index.js';
import { errorHandler } from './utils/errorHandler.js';
import sessionMiddleware from './middlewares/sessionMiddleware.js';
import socketService from './services/socketService.js';

const app = express();
const server = createServer(app);
const port = 3000;

socketService.initialize(server);

// CORS configuration
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Session-Id',
    ],
  })
);

// Parse JSON bodies
app.use(express.json());

app.use(sessionMiddleware);

// Use routes
app.use('/', routes);

// Global error handler (must be last)
app.use(errorHandler);

// Prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`Server + Socket.IO running on port ${port}`);
});
