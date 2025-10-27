import roomService from '../services/roomService.js';
// import { asyncHandler } from '../utils/errorHandler.js';

export const createRoom = async (req, res) => {
  const room = await roomService.createRoom(req.body?.user, req.body?.room);
  res.json(room);
};

export const joinRoom = (req, res) => {
  console.log('Body received', req.body);
  const room = roomService.joinRoom(req.body?.user, req.params?.roomId);
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
