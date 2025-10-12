import express from 'express';
import roomRoutes from './roomRoutes.js';

const router = express.Router();

router.use('/', roomRoutes);

export default router;