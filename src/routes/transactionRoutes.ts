import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
} from '../controllers/transactionController';

const router = Router();

router.use(authenticate);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);

export default router;
