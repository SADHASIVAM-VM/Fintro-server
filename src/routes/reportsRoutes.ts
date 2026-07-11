import { Router } from 'express';
import { exportExpensesCSV } from '../controllers/reportsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/expenses/csv', authenticate, exportExpensesCSV);

export default router;
