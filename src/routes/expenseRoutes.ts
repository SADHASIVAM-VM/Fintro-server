import { Router } from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController';
import { processReceiptUpload } from '../controllers/inboxController';
import { authenticate } from '../middleware/auth';
import { upload } from '../services/imageUpload';

const router = Router();

router.use(authenticate);

router.get('/', getExpenses);
router.post('/', upload.single('receipt'), createExpense);
router.post('/ocr', upload.single('receipt'), processReceiptUpload);
router.post('/upload', upload.single('receipt'), processReceiptUpload);
router.patch('/:id', upload.single('receipt'), updateExpense);
router.delete('/:id', deleteExpense);

export default router;
