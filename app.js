import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './utils/errorHandler.js';

const app = express();
const port = 3000;

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-Id']
}));

// Parse JSON bodies
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
