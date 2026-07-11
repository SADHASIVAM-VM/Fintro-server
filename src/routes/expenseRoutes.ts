import { Router } from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController';
import { authenticate } from '../middleware/auth';
import { upload } from '../services/imageUpload';

const router = Router();

router.use(authenticate);

router.get('/', getExpenses);
router.post('/', upload.single('receipt'), createExpense);
router.patch('/:id', upload.single('receipt'), updateExpense);
router.delete('/:id', deleteExpense);

export default router;
