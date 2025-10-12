import roomService from '../services/roomService.js';
import { ApiException } from '../utils/ApiException.js';
// import { asyncHandler } from '../utils/errorHandler.js';

export const createRoom = (req, res) => {
  const room = roomService.createRoom(req.body?.user, req.body?.room);
  res.json(room);
};

// // For async operations, wrap with asyncHandler
// export const getHealth = asyncHandler(async (req, res) => {
//   const isHealthy = Math.random() > 0.1;
  
//   if (!isHealthy) {
//     throw new ApiException('Service temporarily unavailable', 503);
//   }
  
//   res.json({ 
//     status: 'healthy',
//     uptime: process.uptime(),
//     timestamp: new Date().toISOString()
//   });
// });