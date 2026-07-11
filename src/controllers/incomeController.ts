import { Response } from 'express';
import { Income } from '../models/Income';
import { AuthenticatedRequest } from '../middleware/auth';

// GET ALL INCOMES
export const getIncomes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
    const incomes = await Income.find(query).sort({ date: -1 }).lean();
    res.status(200).json(incomes);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching incomes' });
  }
};

// CREATE INCOME
export const createIncome = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { source, amount, date, notes } = req.body;

  try {
    const income = new Income({
      source,
      amount: Number(amount),
      date,
      notes,
      createdBy: req.user.id,
    });
    
    await income.save();
    res.status(201).json(income);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating income' });
  }
};

// DELETE INCOME
export const deleteIncome = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  try {
    const income = await Income.findById(id);
    if (!income) {
      res.status(404).json({ message: 'Income record not found' });
      return;
    }

    if (income.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await Income.findByIdAndDelete(id);
    res.status(200).json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting income' });
  }
};
