"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIncome = exports.createIncome = exports.getIncomes = void 0;
const Income_1 = require("../models/Income");
// GET ALL INCOMES
const getIncomes = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
        const incomes = await Income_1.Income.find(query).sort({ date: -1 });
        res.status(200).json(incomes);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching incomes' });
    }
};
exports.getIncomes = getIncomes;
// CREATE INCOME
const createIncome = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { source, amount, date, notes } = req.body;
    try {
        const income = new Income_1.Income({
            source,
            amount: Number(amount),
            date,
            notes,
            createdBy: req.user.id,
        });
        await income.save();
        res.status(201).json(income);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error creating income' });
    }
};
exports.createIncome = createIncome;
// DELETE INCOME
const deleteIncome = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { id } = req.params;
    try {
        const income = await Income_1.Income.findById(id);
        if (!income) {
            res.status(404).json({ message: 'Income record not found' });
            return;
        }
        if (income.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        await Income_1.Income.findByIdAndDelete(id);
        res.status(200).json({ success: true, id });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting income' });
    }
};
exports.deleteIncome = deleteIncome;
