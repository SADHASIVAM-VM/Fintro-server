import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getFinancialInsights, parseNaturalInput } from '../controllers/insightsController';

const router = Router();

router.use(authenticate);

router.get('/', getFinancialInsights);
router.post('/parse-natural', parseNaturalInput);

export default router;
