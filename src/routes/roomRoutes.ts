import { Router } from 'express';
import {
  getRoomRents,
  createRoomRent,
  payRoomRent,
  getRoomBills,
  createRoomBill,
  payRoomBill,
  getRoomPurchases,
  createRoomPurchase,
  deleteRoomPurchase,
  getRoomInventory,
  createRoomInventoryItem,
  updateRoomInventoryItem,
  deleteRoomInventoryItem,
} from '../controllers/roomController';
import { authenticate } from '../middleware/auth';
import { upload } from '../services/imageUpload';

const router = Router();

router.use(authenticate);

// Rent Routes
router.get('/rents', getRoomRents);
router.post('/rents', createRoomRent);
router.post('/rents/:id/pay', payRoomRent);

// Bills Routes
router.get('/bills', getRoomBills);
router.post('/bills', createRoomBill);
router.post('/bills/:id/pay', payRoomBill);

// Purchases Routes
router.get('/purchases', getRoomPurchases);
router.post('/purchases', upload.single('bill'), createRoomPurchase);
router.delete('/purchases/:id', deleteRoomPurchase);

// Inventory Routes
router.get('/inventory', getRoomInventory);
router.post('/inventory', createRoomInventoryItem);
router.patch('/inventory/:id', updateRoomInventoryItem);
router.delete('/inventory/:id', deleteRoomInventoryItem);

export default router;
