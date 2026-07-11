import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Protect all endpoints under user routes router
router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', authorize(['admin']), createUser);
router.patch('/:id', updateUser);
router.delete('/:id', authorize(['admin']), deleteUser);

export default router;
