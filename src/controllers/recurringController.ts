import { Response } from 'express';
import { RecurringTransaction } from '../models/RecurringTransaction';
import { AuthenticatedRequest } from '../middleware/auth';

export const getRecurringTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const list = await RecurringTransaction.find({ userId: req.user.id, isActive: true })
      .populate('accountId', 'name type')
      .populate('categoryId', 'name color icon')
      .sort({ nextOccurrence: 1 });

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch recurring transactions' });
  }
};

export const createRecurringTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { name, amount, type, frequency, startDate, endDate, accountId, categoryId } = req.body;

    if (!name || !amount || !type || !startDate || !accountId) {
      res.status(400).json({ message: 'Name, amount, type, start date, and account are required' });
      return;
    }

    const item = await RecurringTransaction.create({
      userId: req.user.id,
      name,
      amount: Number(amount),
      type,
      frequency: frequency || 'monthly',
      startDate,
      endDate: endDate || undefined,
      nextOccurrence: startDate,
      accountId,
      categoryId: categoryId || undefined,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Recurring transaction scheduled',
      data: item,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create recurring transaction' });
  }
};

export const deleteRecurringTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { id } = req.params;
    await RecurringTransaction.updateOne({ _id: id, userId: req.user.id }, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Recurring transaction cancelled',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete recurring transaction' });
  }
};
