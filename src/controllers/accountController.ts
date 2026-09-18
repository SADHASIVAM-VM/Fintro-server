import { Response } from 'express';
import { Account } from '../models/Account';
import { AuthenticatedRequest } from '../middleware/auth';

// GET ALL ACCOUNTS FOR USER
export const getAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const accounts = await Account.find({ userId: req.user.id, isActive: true }).sort({ createdAt: -1 });
    const totalBalance = accounts.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);

    res.status(200).json({
      success: true,
      data: accounts,
      meta: {
        totalAccounts: accounts.length,
        totalBalance,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch accounts' });
  }
};

// CREATE ACCOUNT
export const createAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { name, type, institution, accountIdentifier, openingBalance, currency } = req.body;

    if (!name || !type) {
      res.status(400).json({ message: 'Name and Account Type are required' });
      return;
    }

    const initBalance = Number(openingBalance) || 0;

    const account = await Account.create({
      userId: req.user.id,
      name,
      type,
      institution: institution || '',
      accountIdentifier: accountIdentifier || '',
      openingBalance: initBalance,
      currentBalance: initBalance,
      currency: currency || 'INR',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: account,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create account' });
  }
};

// UPDATE ACCOUNT
export const updateAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { id } = req.params;
    const account = await Account.findOne({ _id: id, userId: req.user.id });

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    const { name, type, institution, accountIdentifier, currentBalance, isActive } = req.body;

    if (name) account.name = name;
    if (type) account.type = type;
    if (institution !== undefined) account.institution = institution;
    if (accountIdentifier !== undefined) account.accountIdentifier = accountIdentifier;
    if (currentBalance !== undefined) account.currentBalance = Number(currentBalance);
    if (isActive !== undefined) account.isActive = Boolean(isActive);

    await account.save();

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: account,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update account' });
  }
};

// DELETE / ARCHIVE ACCOUNT
export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { id } = req.params;
    const account = await Account.findOne({ _id: id, userId: req.user.id });

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    account.isActive = false;
    await account.save();

    res.status(200).json({
      success: true,
      message: 'Account archived successfully',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to archive account' });
  }
};
