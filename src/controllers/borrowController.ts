import { Response } from 'express';
import { BorrowAccount } from '../models/BorrowAccount';
import { BorrowTransaction } from '../models/BorrowTransaction';
import { AuthenticatedRequest } from '../middleware/auth';
import { cloudnairyUpload } from '../services/upload.service';

// GET ACCOUNTS WITH SUMMARY
export const getBorrowAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const query: any = {};
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }

    const accounts = await BorrowAccount.find(query).lean();
    const accountIds = accounts.map(acc => acc._id);

    // Optimized: Fetch all transactions in one query instead of in a loop
    const allTxs = await BorrowTransaction.find({ account: { $in: accountIds } }).lean();

    // Map transactions to accounts in-memory
    const txsByAccount = allTxs.reduce((map: any, tx) => {
      const key = tx.account.toString();
      if (!map[key]) map[key] = [];
      map[key].push(tx);
      return map;
    }, {});

    const summaries = accounts.map((acc) => {
      const txs = txsByAccount[acc._id.toString()] || [];
      let totalBorrowed = 0;
      let totalLent = 0;
      let paidBorrow = 0;
      let paidLent = 0;

      txs.forEach((t: any) => {
        if (t.type === 'borrowed') totalBorrowed += t.amount;
        else if (t.type === 'lent') totalLent += t.amount;
        else if (t.type === 'paid_borrow') paidBorrow += t.amount;
        else if (t.type === 'paid_lent') paidLent += t.amount;
      });

      const netBorrowedOutstanding = Math.max(0, totalBorrowed - paidBorrow);
      const netLentOutstanding = Math.max(0, totalLent - paidLent);

      return {
        account: acc,
        totalBorrowed,
        totalLent,
        paidBorrow,
        paidLent,
        netBorrowedOutstanding,
        netLentOutstanding,
        remaining: netBorrowedOutstanding > 0 ? netBorrowedOutstanding : netLentOutstanding,
        balanceType: netBorrowedOutstanding > 0 ? 'borrowed' : netLentOutstanding > 0 ? 'lent' : 'settled',
      };
    });

    res.status(200).json(summaries);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading borrow accounts' });
  }
};

// CREATE ACCOUNT
export const createBorrowAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { name, phone } = req.body;

  try {
    const account = new BorrowAccount({
      name,
      phone,
      createdBy: req.user.id,
    });
    await account.save();
    res.status(201).json(account);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating borrow account' });
  }
};

// ADD TRANSACTION (Borrowed, Lent, Settlement Paybacks)
export const addBorrowTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { accountId, type, amount, date, notes, parentTransaction } = req.body;

  try {
    const acc = await BorrowAccount.findById(accountId);
    if (!acc) {
      res.status(404).json({ message: 'Borrow account not found' });
      return;
    }

    let receiptImage: string | undefined = undefined;
    if (req.file) {
      const uploadResult = await cloudnairyUpload(req.file);
      if (uploadResult?.success && uploadResult.Url?.secure_url) {
        receiptImage = uploadResult.Url.secure_url;
      }
    }

    const tx = new BorrowTransaction({
      account: accountId,
      type,
      amount: Number(amount),
      date,
      receiptImage,
      notes,
      createdBy: req.user.id,
      parentTransaction: parentTransaction || undefined,
    });
    await tx.save();

    // Dynamically update account status based on balance
    const txs = await BorrowTransaction.find({ account: accountId }).lean();
    let borrowed = 0;
    let lent = 0;
    let paidB = 0;
    let paidL = 0;

    txs.forEach((t: any) => {
      if (t.type === 'borrowed') borrowed += t.amount;
      else if (t.type === 'lent') lent += t.amount;
      else if (t.type === 'paid_borrow') paidB += t.amount;
      else if (t.type === 'paid_lent') paidL += t.amount;
    });

    const isSettled = borrowed - paidB === 0 && lent - paidL === 0;
    acc.status = isSettled ? 'closed' : 'pending';
    await acc.save();

    res.status(201).json(tx);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error saving borrow transaction' });
  }
};

// GET TRANSACTION HISTORY
export const getBorrowHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { accountId } = req.params;

  try {
    const txs = await BorrowTransaction.find({ account: accountId }).sort({ date: -1 }).lean();
    res.status(200).json(txs);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading transaction history' });
  }
};
