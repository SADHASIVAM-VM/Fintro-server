import { Router } from 'express';
import { getSavingsGoals, createSavingsGoal, updateSavingsProgress, deleteSavingsGoal } from '../controllers/savingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getSavingsGoals);
router.post('/', createSavingsGoal);
router.patch('/:id/progress', updateSavingsProgress);
router.delete('/:id', deleteSavingsGoal);

export default router;
