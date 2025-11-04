import express from 'express';
import roomRoutes from './roomRoutes.js';
import { getHealth } from '../controllers/healthController.js';

const router = express.Router();

router.use('/health', getHealth);
router.use('/', roomRoutes);

export default router;
