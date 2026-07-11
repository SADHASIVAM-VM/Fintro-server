import { Response } from 'express';
import { Settings } from '../models/Settings';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { Budget } from '../models/Budget';
import { Emi } from '../models/Emi';
import { BorrowAccount } from '../models/BorrowAccount';
import { BorrowTransaction } from '../models/BorrowTransaction';
import { RoomRent } from '../models/RoomRent';
import { RoomBill } from '../models/RoomBill';
import { RoomInventory } from '../models/RoomInventory';
import { RoomPurchase } from '../models/RoomPurchase';
import { SavingsGoal } from '../models/SavingsGoal';
import { AuthenticatedRequest } from '../middleware/auth';
import dayjs from 'dayjs';

// GET SETTINGS
export const getSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    let settings = await Settings.findOne({ user: req.user.id });
    if (!settings) {
      settings = new Settings({ user: req.user.id });
      await settings.save();
    }
    res.status(200).json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading settings' });
  }
};

// UPDATE SETTINGS
export const updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const { currency, timezone, language, budgetLimits, notificationFlags } = req.body;
  try {
    let settings = await Settings.findOne({ user: req.user.id });
    if (!settings) {
      settings = new Settings({ user: req.user.id });
    }
    if (currency) settings.currency = currency;
    if (timezone) settings.timezone = timezone;
    if (language) settings.language = language;
    if (budgetLimits !== undefined) settings.budgetLimits = budgetLimits;
    if (notificationFlags) settings.notificationFlags = notificationFlags;
    await settings.save();
    res.status(200).json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error saving settings' });
  }
};

// JSON BACKUP EXPORT
export const exportBackup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const userId = req.user.id;
  try {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      expenses: await Expense.find({ createdBy: userId }).lean(),
      income: await Income.find({ createdBy: userId }).lean(),
      budgets: await Budget.find({ createdBy: userId }).lean(),
      emis: await Emi.find({ createdBy: userId }).lean(),
      borrowAccounts: await BorrowAccount.find({ createdBy: userId }).lean(),
      borrowTransactions: await BorrowTransaction.find({ createdBy: userId }).lean(),
      roomRents: await RoomRent.find({ createdBy: userId }).lean(),
      roomBills: await RoomBill.find({ createdBy: userId }).lean(),
      roomInventory: await RoomInventory.find({ createdBy: userId }).lean(),
      roomPurchases: await RoomPurchase.find({ createdBy: userId }).lean(),
      savingsGoals: await SavingsGoal.find({ createdBy: userId }).lean(),
    };
    
    res.setHeader('Content-disposition', `attachment; filename=pfms-backup-${dayjs().format('YYYY-MM-DD')}.json`);
    res.setHeader('Content-type', 'application/json');
    res.status(200).json(backupData);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error exporting backup' });
  }
};

// JSON BACKUP RESTORE IMPORT
export const importRestore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const userId = req.user.id;
  const { backupJson } = req.body;
  if (!backupJson) {
    res.status(400).json({ message: 'Backup JSON data is required' });
    return;
  }
  try {
    // Drop existing records
    await Expense.deleteMany({ createdBy: userId });
    await Income.deleteMany({ createdBy: userId });
    await Budget.deleteMany({ createdBy: userId });
    await Emi.deleteMany({ createdBy: userId });
    await BorrowAccount.deleteMany({ createdBy: userId });
    await BorrowTransaction.deleteMany({ createdBy: userId });
    await RoomRent.deleteMany({ createdBy: userId });
    await RoomBill.deleteMany({ createdBy: userId });
    await RoomInventory.deleteMany({ createdBy: userId });
    await RoomPurchase.deleteMany({ createdBy: userId });
    await SavingsGoal.deleteMany({ createdBy: userId });

    // Restore records
    if (backupJson.expenses) {
      await Expense.insertMany(backupJson.expenses.map((e: any) => ({ ...e, createdBy: userId, _id: undefined })));
    }
    if (backupJson.income) {
      await Income.insertMany(backupJson.income.map((i: any) => ({ ...i, createdBy: userId, _id: undefined })));
    }
    if (backupJson.budgets) {
      await Budget.insertMany(backupJson.budgets.map((b: any) => ({ ...b, createdBy: userId, _id: undefined })));
    }
    if (backupJson.emis) {
      await Emi.insertMany(backupJson.emis.map((em: any) => ({ ...em, createdBy: userId, _id: undefined })));
    }
    if (backupJson.borrowAccounts) {
      await BorrowAccount.insertMany(backupJson.borrowAccounts.map((ba: any) => ({ ...ba, createdBy: userId, _id: undefined })));
    }
    if (backupJson.borrowTransactions) {
      await BorrowTransaction.insertMany(backupJson.borrowTransactions.map((bt: any) => ({ ...bt, createdBy: userId, _id: undefined })));
    }
    if (backupJson.roomRents) {
      await RoomRent.insertMany(backupJson.roomRents.map((rr: any) => ({ ...rr, createdBy: userId, _id: undefined })));
    }
    if (backupJson.roomBills) {
      await RoomBill.insertMany(backupJson.roomBills.map((rb: any) => ({ ...rb, createdBy: userId, _id: undefined })));
    }
    if (backupJson.roomInventory) {
      await RoomInventory.insertMany(backupJson.roomInventory.map((ri: any) => ({ ...ri, createdBy: userId, _id: undefined })));
    }
    if (backupJson.roomPurchases) {
      await RoomPurchase.insertMany(backupJson.roomPurchases.map((rp: any) => ({ ...rp, createdBy: userId, _id: undefined })));
    }
    if (backupJson.savingsGoals) {
      await SavingsGoal.insertMany(backupJson.savingsGoals.map((sg: any) => ({ ...sg, createdBy: userId, _id: undefined })));
    }

    res.status(200).json({ success: true, message: 'Database successfully restored from JSON backup file!' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error restoring backup' });
  }
};
