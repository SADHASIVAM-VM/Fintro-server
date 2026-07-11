import { Router } from 'express';
import { getSettings, updateSettings, exportBackup, importRestore } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.patch('/', updateSettings);
router.get('/backup', exportBackup);
router.post('/restore', importRestore);

export default router;
