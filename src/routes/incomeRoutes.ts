import { Router } from 'express';
import { getIncomes, createIncome, deleteIncome } from '../controllers/incomeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getIncomes);
router.post('/', createIncome);
router.delete('/:id', deleteIncome);

export default router;
