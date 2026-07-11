import { Response } from 'express';
import { SavingsGoal } from '../models/SavingsGoal';
import { AuthenticatedRequest } from '../middleware/auth';

// GET GOALS
export const getSavingsGoals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
    const goals = await SavingsGoal.find(query).sort({ targetDate: 1 }).lean();
    res.status(200).json(goals);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading savings goals' });
  }
};

// CREATE SAVINGS GOAL
export const createSavingsGoal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { title, targetAmount, currentAmount, targetDate, interval } = req.body;

  try {
    const goal = new SavingsGoal({
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      targetDate,
      interval,
      createdBy: req.user.id,
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating savings goal' });
  }
};

// UPDATE SAVINGS PROGRESS
export const updateSavingsProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { amount } = req.body; // Net cash adjustment (can be positive or negative)

  try {
    const goal = await SavingsGoal.findById(id);
    if (!goal) {
      res.status(404).json({ message: 'Savings goal not found' });
      return;
    }

    goal.currentAmount = Math.max(0, goal.currentAmount + Number(amount));
    await goal.save();
    res.status(200).json(goal);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating savings progress' });
  }
};

// DELETE GOAL
export const deleteSavingsGoal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const goal = await SavingsGoal.findByIdAndDelete(id);
    if (!goal) {
      res.status(404).json({ message: 'Savings goal not found' });
      return;
    }
    res.status(200).json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting savings goal' });
  }
};
