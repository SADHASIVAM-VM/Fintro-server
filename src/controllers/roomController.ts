import { Response } from 'express';
import { RoomRent } from '../models/RoomRent';
import { RoomBill } from '../models/RoomBill';
import { RoomInventory } from '../models/RoomInventory';
import { RoomPurchase } from '../models/RoomPurchase';
import { AuthenticatedRequest } from '../middleware/auth';
import { cloudnairyUpload } from '../services/upload.service';

// --- ROOM RENT ENDPOINTS ---

export const getRoomRents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = req.user?.role === 'admin' ? {} : { createdBy: req.user?.id };
    const rents = await RoomRent.find(query).sort({ month: -1 });
    res.status(200).json(rents);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching room rents' });
  }
};

export const createRoomRent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { month, rentAmount, dueDate } = req.body;
  try {
    const rent = new RoomRent({
      month,
      rentAmount: Number(rentAmount),
      isPaid: false,
      dueDate,
      createdBy: req.user?.id,
    });
    await rent.save();
    res.status(201).json(rent);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating rent record' });
  }
};

export const payRoomRent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { paidDate } = req.body;
  try {
    const rent = await RoomRent.findById(id);
    if (!rent) {
      res.status(404).json({ message: 'Rent record not found' });
      return;
    }
    rent.isPaid = true;
    rent.paidDate = paidDate || new Date().toISOString().split('T')[0];
    await rent.save();
    res.status(200).json(rent);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating rent' });
  }
};

// --- ROOM UTILITY BILLS ENDPOINTS ---

export const getRoomBills = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = req.user?.role === 'admin' ? {} : { createdBy: req.user?.id };
    const bills = await RoomBill.find(query).sort({ month: -1 });
    res.status(200).json(bills);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading bills' });
  }
};

export const createRoomBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { month, type, amount, units, dueDate } = req.body;
  try {
    const bill = new RoomBill({
      month,
      type,
      amount: Number(amount),
      units: units ? Number(units) : undefined,
      isPaid: false,
      dueDate,
      createdBy: req.user?.id,
    });
    await bill.save();
    res.status(201).json(bill);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating bill' });
  }
};

export const payRoomBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const bill = await RoomBill.findById(id);
    if (!bill) {
      res.status(404).json({ message: 'Bill record not found' });
      return;
    }
    bill.isPaid = true;
    await bill.save();
    res.status(200).json(bill);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating bill payment' });
  }
};

// --- ROOM PURCHASES ENDPOINTS ---

export const getRoomPurchases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = req.user?.role === 'admin' ? {} : { createdBy: req.user?.id };
    const purchases = await RoomPurchase.find(query).sort({ date: -1 });
    res.status(200).json(purchases);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading room purchases' });
  }
};

export const createRoomPurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, price, quantity, shop, date, warrantyMonths, category } = req.body;
  try {
    let billImage: string | undefined = undefined;
    if (req.file) {
      const uploadResult = await cloudnairyUpload(req.file);
      if (uploadResult?.success && uploadResult.Url?.secure_url) {
        billImage = uploadResult.Url.secure_url;
      }
    }

    const purchase = new RoomPurchase({
      name,
      price: Number(price),
      quantity: Number(quantity),
      shop,
      date,
      warrantyMonths: warrantyMonths ? Number(warrantyMonths) : 0,
      billImage,
      category,
      createdBy: req.user?.id,
    });
    await purchase.save();
    res.status(201).json(purchase);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error saving room purchase' });
  }
};

// --- ROOM INVENTORY ENDPOINTS ---

export const getRoomInventory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = req.user?.role === 'admin' ? {} : { createdBy: req.user?.id };
    const inventory = await RoomInventory.find(query);
    res.status(200).json(inventory);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading inventory' });
  }
};

export const createRoomInventoryItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { item, customName, quantity, status } = req.body;
  try {
    const inv = new RoomInventory({
      item,
      customName,
      quantity: Number(quantity),
      status: status || 'working',
      lastChecked: new Date().toISOString().split('T')[0],
      createdBy: req.user?.id,
    });
    await inv.save();
    res.status(201).json(inv);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error adding inventory item' });
  }
};

export const updateRoomInventoryItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, quantity } = req.body;
  try {
    const item = await RoomInventory.findById(id);
    if (!item) {
      res.status(404).json({ message: 'Inventory item not found' });
      return;
    }
    if (status) item.status = status;
    if (quantity) item.quantity = Number(quantity);
    item.lastChecked = new Date().toISOString().split('T')[0];
    await item.save();
    res.status(200).json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating inventory' });
  }
};
export const deleteRoomInventoryItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const item = await RoomInventory.findByIdAndDelete(id);
    if (!item) {
      res.status(404).json({ message: 'Inventory item not found' });
      return;
    }
    res.status(200).json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting inventory item' });
  }
};
