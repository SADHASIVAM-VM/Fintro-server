import { Router } from 'express';
import { getBorrowAccounts, createBorrowAccount, addBorrowTransaction, getBorrowHistory } from '../controllers/borrowController';
import { authenticate } from '../middleware/auth';
import { upload } from '../services/imageUpload';

const router = Router();

router.use(authenticate);

router.get('/accounts', getBorrowAccounts);
router.post('/accounts', createBorrowAccount);
router.post('/transactions', upload.single('receipt'), addBorrowTransaction);
router.get('/accounts/:accountId/history', getBorrowHistory);

export default router;
