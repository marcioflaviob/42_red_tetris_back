import express from 'express';
import { createRoom, joinRoom } from '../controllers/roomController.js';

const router = express.Router();

router.post('/room', createRoom);
router.post('/room/:roomId/join', joinRoom);

export default router;
