import { Response } from 'express';
import { Receipt } from '../models/Receipt';
import { Transaction } from '../models/Transaction';
import { FinancialRule } from '../models/FinancialRule';
import { Account } from '../models/Account';
import { AuthenticatedRequest } from '../middleware/auth';
import { ocrProvider } from '../services/ocr.service';
import dayjs from 'dayjs';

// GET FINANCIAL INBOX DRAFTS
export const getInboxItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const userId = req.user.id;
    const unconfirmedReceipts = await Receipt.find({ userId, isConfirmed: false })
      .sort({ createdAt: -1 });

    // Check Duplicate Detection against existing confirmed transactions
    const itemsWithDuplicates = await Promise.all(
      unconfirmedReceipts.map(async (item: any) => {
        const ext = item.extractedData || {};
        let isDuplicate = false;
        let existingMatch: any = null;

        if (ext.amount && ext.date) {
          const match = await Transaction.findOne({
            userId,
            amount: ext.amount,
            date: ext.date,
          }).populate('categoryId', 'name');

          if (match) {
            isDuplicate = true;
            existingMatch = match;
          }
        }

        return {
          ...item.toObject(),
          isDuplicate,
          existingMatch,
        };
      })
    );

    res.status(200).json({
      success: true,
      meta: {
        totalDrafts: itemsWithDuplicates.length,
      },
      data: itemsWithDuplicates,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch financial inbox' });
  }
};

// UPLOAD RECEIPT & RUN OCR EXTRACTION (LANDS IN INBOX)
export const processReceiptUpload = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const fileUrl = `/uploads/${file.filename}`;

    // Process via OCR Provider
    const { ocrText, extractedData } = await ocrProvider.processReceipt(file.path, file.originalname);

    // Apply Automation Rules Engine
    const activeRules = await FinancialRule.find({ userId: req.user.id, isActive: true });
    let matchedCategory: string | undefined = undefined;

    if (extractedData.merchant) {
      const rule = activeRules.find((r) =>
        extractedData.merchant?.toLowerCase().includes(r.merchantPattern.toLowerCase())
      );
      if (rule && rule.targetCategoryId) {
        matchedCategory = String(rule.targetCategoryId);
      }
    }

    const receipt = await Receipt.create({
      userId: req.user.id,
      fileUrl,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      ocrStatus: 'COMPLETED',
      ocrText,
      extractedData: {
        ...extractedData,
        suggestedCategory: matchedCategory,
      },
      confidence: 0.95,
      isConfirmed: false,
    });

    res.status(201).json({
      success: true,
      message: 'Receipt processed via OCR and landed in Financial Inbox',
      data: receipt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'OCR processing failed' });
  }
};

// CONFIRM DRAFT FROM FINANCIAL INBOX
export const confirmInboxItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { id } = req.params;
    const { accountId, categoryId, amount, merchant, description, date } = req.body;

    const receipt = await Receipt.findOne({ _id: id, userId: req.user.id });
    if (!receipt) {
      res.status(404).json({ message: 'Inbox draft not found' });
      return;
    }

    if (!accountId) {
      res.status(400).json({ message: 'Please select a payment account to confirm this transaction' });
      return;
    }

    const account = await Account.findOne({ _id: accountId, userId: req.user.id });
    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    const finalAmount = Number(amount) || receipt.extractedData?.amount || 0;
    const finalMerchant = merchant || receipt.extractedData?.merchant || 'Receipt Merchant';
    const finalDesc = description || `Receipt: ${finalMerchant}`;
    const finalDate = date || receipt.extractedData?.date || dayjs().format('YYYY-MM-DD');

    // Create confirmed transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'EXPENSE',
      amount: finalAmount,
      accountId,
      categoryId: categoryId || undefined,
      description: finalDesc,
      merchant: finalMerchant,
      date: finalDate,
      receiptId: receipt._id,
      status: 'CONFIRMED',
    });

    // Update account balance
    account.currentBalance -= finalAmount;
    await account.save();

    // Mark receipt as confirmed
    receipt.isConfirmed = true;
    await receipt.save();

    res.status(200).json({
      success: true,
      message: 'Transaction confirmed and saved from Financial Inbox',
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to confirm inbox item' });
  }
};

// DELETE DRAFT ITEM
export const deleteInboxItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { id } = req.params;
    await Receipt.deleteOne({ _id: id, userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Draft item removed from Financial Inbox',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete inbox draft' });
  }
};
