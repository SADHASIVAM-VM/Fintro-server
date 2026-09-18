import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getPlanningMetrics } from '../controllers/planningController';

const router = Router();

router.use(authenticate);

router.get('/', getPlanningMetrics);
router.get('/metrics', getPlanningMetrics);

export default router;
