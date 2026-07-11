"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importRestore = exports.exportBackup = exports.updateSettings = exports.getSettings = void 0;
const Settings_1 = require("../models/Settings");
const Expense_1 = require("../models/Expense");
const Income_1 = require("../models/Income");
const Budget_1 = require("../models/Budget");
const Emi_1 = require("../models/Emi");
const BorrowAccount_1 = require("../models/BorrowAccount");
const BorrowTransaction_1 = require("../models/BorrowTransaction");
const RoomRent_1 = require("../models/RoomRent");
const RoomBill_1 = require("../models/RoomBill");
const RoomInventory_1 = require("../models/RoomInventory");
const RoomPurchase_1 = require("../models/RoomPurchase");
const SavingsGoal_1 = require("../models/SavingsGoal");
const dayjs_1 = __importDefault(require("dayjs"));
// GET SETTINGS
const getSettings = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        let settings = await Settings_1.Settings.findOne({ user: req.user.id });
        if (!settings) {
            settings = new Settings_1.Settings({ user: req.user.id });
            await settings.save();
        }
        res.status(200).json(settings);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error loading settings' });
    }
};
exports.getSettings = getSettings;
// UPDATE SETTINGS
const updateSettings = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { currency, timezone, language, budgetLimits, notificationFlags } = req.body;
    try {
        let settings = await Settings_1.Settings.findOne({ user: req.user.id });
        if (!settings) {
            settings = new Settings_1.Settings({ user: req.user.id });
        }
        if (currency)
            settings.currency = currency;
        if (timezone)
            settings.timezone = timezone;
        if (language)
            settings.language = language;
        if (budgetLimits !== undefined)
            settings.budgetLimits = budgetLimits;
        if (notificationFlags)
            settings.notificationFlags = notificationFlags;
        await settings.save();
        res.status(200).json(settings);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error saving settings' });
    }
};
exports.updateSettings = updateSettings;
// JSON BACKUP EXPORT
const exportBackup = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const userId = req.user.id;
    try {
        const backupData = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            expenses: await Expense_1.Expense.find({ createdBy: userId }),
            income: await Income_1.Income.find({ createdBy: userId }),
            budgets: await Budget_1.Budget.find({ createdBy: userId }),
            emis: await Emi_1.Emi.find({ createdBy: userId }),
            borrowAccounts: await BorrowAccount_1.BorrowAccount.find({ createdBy: userId }),
            borrowTransactions: await BorrowTransaction_1.BorrowTransaction.find({ createdBy: userId }),
            roomRents: await RoomRent_1.RoomRent.find({ createdBy: userId }),
            roomBills: await RoomBill_1.RoomBill.find({ createdBy: userId }),
            roomInventory: await RoomInventory_1.RoomInventory.find({ createdBy: userId }),
            roomPurchases: await RoomPurchase_1.RoomPurchase.find({ createdBy: userId }),
            savingsGoals: await SavingsGoal_1.SavingsGoal.find({ createdBy: userId }),
        };
        res.setHeader('Content-disposition', `attachment; filename=pfms-backup-${(0, dayjs_1.default)().format('YYYY-MM-DD')}.json`);
        res.setHeader('Content-type', 'application/json');
        res.status(200).json(backupData);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error exporting backup' });
    }
};
exports.exportBackup = exportBackup;
// JSON BACKUP RESTORE IMPORT
const importRestore = async (req, res) => {
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
        await Expense_1.Expense.deleteMany({ createdBy: userId });
        await Income_1.Income.deleteMany({ createdBy: userId });
        await Budget_1.Budget.deleteMany({ createdBy: userId });
        await Emi_1.Emi.deleteMany({ createdBy: userId });
        await BorrowAccount_1.BorrowAccount.deleteMany({ createdBy: userId });
        await BorrowTransaction_1.BorrowTransaction.deleteMany({ createdBy: userId });
        await RoomRent_1.RoomRent.deleteMany({ createdBy: userId });
        await RoomBill_1.RoomBill.deleteMany({ createdBy: userId });
        await RoomInventory_1.RoomInventory.deleteMany({ createdBy: userId });
        await RoomPurchase_1.RoomPurchase.deleteMany({ createdBy: userId });
        await SavingsGoal_1.SavingsGoal.deleteMany({ createdBy: userId });
        // Restore records
        if (backupJson.expenses) {
            await Expense_1.Expense.insertMany(backupJson.expenses.map((e) => ({ ...e, createdBy: userId, _id: undefined })));
        }
        if (backupJson.income) {
            await Income_1.Income.insertMany(backupJson.income.map((i) => ({ ...i, createdBy: userId, _id: undefined })));
        }
        if (backupJson.budgets) {
            await Budget_1.Budget.insertMany(backupJson.budgets.map((b) => ({ ...b, createdBy: userId, _id: undefined })));
        }
        if (backupJson.emis) {
            await Emi_1.Emi.insertMany(backupJson.emis.map((em) => ({ ...em, createdBy: userId, _id: undefined })));
        }
        if (backupJson.borrowAccounts) {
            await BorrowAccount_1.BorrowAccount.insertMany(backupJson.borrowAccounts.map((ba) => ({ ...ba, createdBy: userId, _id: undefined })));
        }
        if (backupJson.borrowTransactions) {
            await BorrowTransaction_1.BorrowTransaction.insertMany(backupJson.borrowTransactions.map((bt) => ({ ...bt, createdBy: userId, _id: undefined })));
        }
        if (backupJson.roomRents) {
            await RoomRent_1.RoomRent.insertMany(backupJson.roomRents.map((rr) => ({ ...rr, createdBy: userId, _id: undefined })));
        }
        if (backupJson.roomBills) {
            await RoomBill_1.RoomBill.insertMany(backupJson.roomBills.map((rb) => ({ ...rb, createdBy: userId, _id: undefined })));
        }
        if (backupJson.roomInventory) {
            await RoomInventory_1.RoomInventory.insertMany(backupJson.roomInventory.map((ri) => ({ ...ri, createdBy: userId, _id: undefined })));
        }
        if (backupJson.roomPurchases) {
            await RoomPurchase_1.RoomPurchase.insertMany(backupJson.roomPurchases.map((rp) => ({ ...rp, createdBy: userId, _id: undefined })));
        }
        if (backupJson.savingsGoals) {
            await SavingsGoal_1.SavingsGoal.insertMany(backupJson.savingsGoals.map((sg) => ({ ...sg, createdBy: userId, _id: undefined })));
        }
        res.status(200).json({ success: true, message: 'Database successfully restored from JSON backup file!' });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error restoring backup' });
    }
};
exports.importRestore = importRestore;
