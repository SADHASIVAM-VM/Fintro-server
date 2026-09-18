import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  deleteRecurringTransaction,
} from '../controllers/recurringController';

const router = Router();

router.use(authenticate);

router.get('/', getRecurringTransactions);
router.post('/', createRecurringTransaction);
router.delete('/:id', deleteRecurringTransaction);

export default router;
