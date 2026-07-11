import { Response } from 'express';
import { Emi } from '../models/Emi';
import { AuthenticatedRequest } from '../middleware/auth';
import dayjs from 'dayjs';

// GET EMIS LIST
export const getEmis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const query: any = {};
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }
    const emis = await Emi.find(query);
    res.status(200).json(emis);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching EMIs' });
  }
};

// CREATE EMI LOAN
export const createEmi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { loanName, principal, interestRate, monthlyEmi, monthsTotal, dueDate, startDate } = req.body;

  try {
    const emi = new Emi({
      loanName,
      principal: Number(principal),
      interestRate: Number(interestRate),
      monthlyEmi: Number(monthlyEmi),
      monthsTotal: Number(monthsTotal),
      monthsPaid: 0,
      remainingBalance: Number(principal),
      dueDate,
      startDate,
      createdBy: req.user.id,
    });
    await emi.save();
    res.status(201).json(emi);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating EMI record' });
  }
};

// RECORD EMI PAYMENT (PAY NEXT INSTALLMENT)
export const payEmiInstallment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const emi = await Emi.findById(id);
    if (!emi) {
      res.status(404).json({ message: 'EMI record not found' });
      return;
    }

    if (emi.monthsPaid >= emi.monthsTotal) {
      res.status(400).json({ message: 'Loan is already fully paid' });
      return;
    }

    emi.monthsPaid += 1;
    // Deduct EMI principal component (simplified remaining balance adjustment)
    const newBalance = emi.remainingBalance - emi.monthlyEmi;
    emi.remainingBalance = newBalance > 0 ? newBalance : 0;
    
    // Update due date to next month
    const currentDueDate = dayjs(emi.dueDate);
    emi.dueDate = currentDueDate.add(1, 'month').format('YYYY-MM-DD');

    await emi.save();
    res.status(200).json(emi);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error recording EMI payment' });
  }
};

// DELETE EMI
export const deleteEmi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const emi = await Emi.findByIdAndDelete(id);
    if (!emi) {
      res.status(404).json({ message: 'EMI record not found' });
      return;
    }
    res.status(200).json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting EMI record' });
  }
};
