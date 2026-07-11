import { Router } from 'express';
import { getEmis, createEmi, payEmiInstallment, deleteEmi } from '../controllers/emiController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getEmis);
router.post('/', createEmi);
router.post('/:id/pay', payEmiInstallment);
router.delete('/:id', deleteEmi);

export default router;
