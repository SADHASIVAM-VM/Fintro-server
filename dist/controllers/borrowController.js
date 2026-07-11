"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBorrowHistory = exports.addBorrowTransaction = exports.createBorrowAccount = exports.getBorrowAccounts = void 0;
const BorrowAccount_1 = require("../models/BorrowAccount");
const BorrowTransaction_1 = require("../models/BorrowTransaction");
// GET ACCOUNTS WITH SUMMARY
const getBorrowAccounts = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        const query = {};
        if (req.user.role !== 'admin') {
            query.createdBy = req.user.id;
        }
        const accounts = await BorrowAccount_1.BorrowAccount.find(query);
        const summaries = await Promise.all(accounts.map(async (acc) => {
            const txs = await BorrowTransaction_1.BorrowTransaction.find({ account: acc.id });
            let totalBorrowed = 0;
            let totalLent = 0;
            let paidBorrow = 0;
            let paidLent = 0;
            txs.forEach((t) => {
                if (t.type === 'borrowed')
                    totalBorrowed += t.amount;
                else if (t.type === 'lent')
                    totalLent += t.amount;
                else if (t.type === 'paid_borrow')
                    paidBorrow += t.amount;
                else if (t.type === 'paid_lent')
                    paidLent += t.amount;
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
        }));
        res.status(200).json(summaries);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error loading borrow accounts' });
    }
};
exports.getBorrowAccounts = getBorrowAccounts;
// CREATE ACCOUNT
const createBorrowAccount = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { name, phone } = req.body;
    try {
        const account = new BorrowAccount_1.BorrowAccount({
            name,
            phone,
            createdBy: req.user.id,
        });
        await account.save();
        res.status(201).json(account);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error creating borrow account' });
    }
};
exports.createBorrowAccount = createBorrowAccount;
// ADD TRANSACTION (Borrowed, Lent, Settlement Paybacks)
const addBorrowTransaction = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { accountId, type, amount, date, notes, parentTransaction } = req.body;
    try {
        const acc = await BorrowAccount_1.BorrowAccount.findById(accountId);
        if (!acc) {
            res.status(404).json({ message: 'Borrow account not found' });
            return;
        }
        const receiptImage = req.file ? `/uploads/${req.file.filename}` : undefined;
        const tx = new BorrowTransaction_1.BorrowTransaction({
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
        const txs = await BorrowTransaction_1.BorrowTransaction.find({ account: accountId });
        let borrowed = 0;
        let lent = 0;
        let paidB = 0;
        let paidL = 0;
        txs.forEach((t) => {
            if (t.type === 'borrowed')
                borrowed += t.amount;
            else if (t.type === 'lent')
                lent += t.amount;
            else if (t.type === 'paid_borrow')
                paidB += t.amount;
            else if (t.type === 'paid_lent')
                paidL += t.amount;
        });
        const isSettled = borrowed - paidB === 0 && lent - paidL === 0;
        acc.status = isSettled ? 'closed' : 'pending';
        await acc.save();
        res.status(201).json(tx);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error saving borrow transaction' });
    }
};
exports.addBorrowTransaction = addBorrowTransaction;
// GET TRANSACTION HISTORY
const getBorrowHistory = async (req, res) => {
    const { accountId } = req.params;
    try {
        const txs = await BorrowTransaction_1.BorrowTransaction.find({ account: accountId }).sort({ date: -1 });
        res.status(200).json(txs);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error loading transaction history' });
    }
};
exports.getBorrowHistory = getBorrowHistory;
