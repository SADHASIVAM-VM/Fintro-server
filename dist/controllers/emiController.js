"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmi = exports.payEmiInstallment = exports.createEmi = exports.getEmis = void 0;
const Emi_1 = require("../models/Emi");
const dayjs_1 = __importDefault(require("dayjs"));
// GET EMIS LIST
const getEmis = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        const query = {};
        if (req.user.role !== 'admin') {
            query.createdBy = req.user.id;
        }
        const emis = await Emi_1.Emi.find(query);
        res.status(200).json(emis);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching EMIs' });
    }
};
exports.getEmis = getEmis;
// CREATE EMI LOAN
const createEmi = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { loanName, principal, interestRate, monthlyEmi, monthsTotal, dueDate, startDate } = req.body;
    try {
        const emi = new Emi_1.Emi({
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
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error creating EMI record' });
    }
};
exports.createEmi = createEmi;
// RECORD EMI PAYMENT (PAY NEXT INSTALLMENT)
const payEmiInstallment = async (req, res) => {
    const { id } = req.params;
    try {
        const emi = await Emi_1.Emi.findById(id);
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
        const currentDueDate = (0, dayjs_1.default)(emi.dueDate);
        emi.dueDate = currentDueDate.add(1, 'month').format('YYYY-MM-DD');
        await emi.save();
        res.status(200).json(emi);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error recording EMI payment' });
    }
};
exports.payEmiInstallment = payEmiInstallment;
// DELETE EMI
const deleteEmi = async (req, res) => {
    const { id } = req.params;
    try {
        const emi = await Emi_1.Emi.findByIdAndDelete(id);
        if (!emi) {
            res.status(404).json({ message: 'EMI record not found' });
            return;
        }
        res.status(200).json({ success: true, id });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting EMI record' });
    }
};
exports.deleteEmi = deleteEmi;
