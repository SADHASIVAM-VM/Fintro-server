import { Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { AuthenticatedRequest } from '../middleware/auth';

// GET PAGINATED TRANSACTIONS
export const getTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const type = req.query.type ? String(req.query.type) : '';
    const accountId = req.query.accountId ? String(req.query.accountId) : '';
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : '';
    const startDate = req.query.startDate ? String(req.query.startDate) : '';
    const endDate = req.query.endDate ? String(req.query.endDate) : '';
    const search = req.query.search ? String(req.query.search) : '';

    const query: any = { userId: req.user.id };

    if (type) query.type = type;
    if (accountId) query.accountId = accountId;
    if (categoryId) query.categoryId = categoryId;

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { merchant: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('accountId', 'name type')
      .populate('destinationAccountId', 'name type')
      .populate('categoryId', 'name color icon')
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: transactions,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch transactions' });
  }
};

// CREATE UNIFIED TRANSACTION
export const createTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const {
      type,
      amount,
      accountId,
      destinationAccountId,
      categoryId,
      personId,
      roomId,
      loanId,
      description,
      merchant,
      date,
      paymentMethod,
      notes,
      tags,
    } = req.body;

    if (!type || !amount || !accountId || !description || !date) {
      res.status(400).json({ message: 'Type, amount, source account, description, and date are required' });
      return;
    }

    const numAmount = Number(amount);
    if (numAmount <= 0) {
      res.status(400).json({ message: 'Amount must be greater than 0' });
      return;
    }

    // Source Account lookup & validation
    const account = await Account.findOne({ _id: accountId, userId: req.user.id });
    if (!account) {
      res.status(404).json({ message: 'Source account not found' });
      return;
    }

    // Handle TRANSFER destination account
    let destAccount: any = null;
    if (type === 'TRANSFER') {
      if (!destinationAccountId) {
        res.status(400).json({ message: 'Destination account is required for transfers' });
        return;
      }
      if (String(accountId) === String(destinationAccountId)) {
        res.status(400).json({ message: 'Source and destination accounts cannot be the same' });
        return;
      }
      destAccount = await Account.findOne({ _id: destinationAccountId, userId: req.user.id });
      if (!destAccount) {
        res.status(404).json({ message: 'Destination account not found' });
        return;
      }
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount: numAmount,
      accountId,
      destinationAccountId: destinationAccountId || undefined,
      categoryId: categoryId || undefined,
      personId: personId || undefined,
      roomId: roomId || undefined,
      loanId: loanId || undefined,
      description,
      merchant: merchant || '',
      date,
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || '',
      tags: tags || [],
      status: 'CONFIRMED',
    });

    // Update Account Balances based on Data Integrity Rules
    if (type === 'EXPENSE' || type === 'LEND' || type === 'EMI_PAYMENT') {
      account.currentBalance -= numAmount;
      await account.save();
    } else if (type === 'INCOME' || type === 'BORROW' || type === 'REFUND') {
      account.currentBalance += numAmount;
      await account.save();
    } else if (type === 'TRANSFER') {
      account.currentBalance -= numAmount;
      await account.save();
      destAccount.currentBalance += numAmount;
      await destAccount.save();
    } else if (type === 'REPAYMENT') {
      // Repayment direction depends on description or context
      account.currentBalance += numAmount;
      await account.save();
    }

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create transaction' });
  }
};

// DELETE TRANSACTION & REVERT BALANCE
export const deleteTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({ _id: id, userId: req.user.id });

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    // Revert account balances
    const account = await Account.findById(transaction.accountId);
    if (account) {
      if (['EXPENSE', 'LEND', 'EMI_PAYMENT'].includes(transaction.type)) {
        account.currentBalance += transaction.amount;
      } else if (['INCOME', 'BORROW', 'REFUND', 'REPAYMENT'].includes(transaction.type)) {
        account.currentBalance -= transaction.amount;
      } else if (transaction.type === 'TRANSFER') {
        account.currentBalance += transaction.amount;
        if (transaction.destinationAccountId) {
          const destAccount = await Account.findById(transaction.destinationAccountId);
          if (destAccount) {
            destAccount.currentBalance -= transaction.amount;
            await destAccount.save();
          }
        }
      }
      await account.save();
    }

    await Transaction.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Transaction deleted and account balance updated',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete transaction' });
  }
};
