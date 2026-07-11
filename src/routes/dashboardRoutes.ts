import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getDashboardData);

export default router;
