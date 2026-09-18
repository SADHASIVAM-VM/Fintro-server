import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../services/imageUpload';
import {
  getInboxItems,
  processReceiptUpload,
  confirmInboxItem,
  deleteInboxItem,
} from '../controllers/inboxController';

const router = Router();

router.use(authenticate);

router.get('/', getInboxItems);
router.post('/upload', upload.single('receipt'), processReceiptUpload);
router.post('/:id/confirm', confirmInboxItem);
router.delete('/:id', deleteInboxItem);

export default router;
