import { Router } from 'express';
import {
  exportExpensesCSV,
  sendWeeklyReviewEmail,
  previewWeeklyReview,
} from '../controllers/reportsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/expenses/csv', authenticate, exportExpensesCSV);
router.post('/send-weekly-review', authenticate, sendWeeklyReviewEmail);
router.get('/preview-weekly-review', authenticate, previewWeeklyReview);

export default router;
