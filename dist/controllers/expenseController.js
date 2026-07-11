"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpenses = void 0;
const Expense_1 = require("../models/Expense");
const Category_1 = require("../models/Category");
// GET PAGINATED EXPENSES
const getExpenses = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search ? String(req.query.search) : '';
        const category = req.query.category ? String(req.query.category) : '';
        const paymentMode = req.query.paymentMode ? String(req.query.paymentMode) : '';
        const startDate = req.query.startDate ? String(req.query.startDate) : '';
        const endDate = req.query.endDate ? String(req.query.endDate) : '';
        const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'date';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const query = {};
        // Role check: users can only view their own expenses; admins can view everything
        if (req.user.role !== 'admin') {
            query.createdBy = req.user.id;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }
        if (category) {
            query.category = category;
        }
        if (paymentMode) {
            query.paymentMode = paymentMode;
        }
        if (startDate || endDate) {
            query.date = {};
            if (startDate)
                query.date.$gte = startDate;
            if (endDate)
                query.date.$lte = endDate;
        }
        const sortOption = {};
        sortOption[sortBy] = sortOrder;
        const total = await Expense_1.Expense.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const expenses = await Expense_1.Expense.find(query)
            .populate('category', 'name color icon')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);
        res.status(200).json({
            data: expenses,
            total,
            page,
            limit,
            totalPages,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error loading expenses' });
    }
};
exports.getExpenses = getExpenses;
// CREATE EXPENSE
const createExpense = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { title, amount, category, paymentMode, date, time, notes, tags } = req.body;
    try {
        // Validate category exists
        const cat = await Category_1.Category.findById(category);
        if (!cat) {
            res.status(400).json({ message: 'Invalid category' });
            return;
        }
        const receiptImage = req.file ? `/uploads/${req.file.filename}` : undefined;
        const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
        const expense = new Expense_1.Expense({
            title,
            amount: Number(amount),
            category,
            paymentMode,
            date,
            time,
            notes,
            tags: parsedTags,
            receiptImage,
            createdBy: req.user.id,
        });
        await expense.save();
        const populated = await expense.populate('category', 'name color icon');
        res.status(201).json(populated);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error creating expense' });
    }
};
exports.createExpense = createExpense;
// UPDATE EXPENSE
const updateExpense = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { id } = req.params;
    const { title, amount, category, paymentMode, date, time, notes, tags } = req.body;
    try {
        const expense = await Expense_1.Expense.findById(id);
        if (!expense) {
            res.status(404).json({ message: 'Expense not found' });
            return;
        }
        // Role check: Only author or admins can edit
        if (expense.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden. You can only edit your own expenses.' });
            return;
        }
        if (category) {
            const cat = await Category_1.Category.findById(category);
            if (!cat) {
                res.status(400).json({ message: 'Invalid category' });
                return;
            }
            expense.category = category;
        }
        if (title)
            expense.title = title;
        if (amount)
            expense.amount = Number(amount);
        if (paymentMode)
            expense.paymentMode = paymentMode;
        if (date)
            expense.date = date;
        if (time)
            expense.time = time;
        if (notes)
            expense.notes = notes;
        if (tags) {
            expense.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }
        if (req.file) {
            expense.receiptImage = `/uploads/${req.file.filename}`;
        }
        await expense.save();
        const populated = await expense.populate('category', 'name color icon');
        res.status(200).json(populated);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error updating expense' });
    }
};
exports.updateExpense = updateExpense;
// DELETE EXPENSE
const deleteExpense = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { id } = req.params;
    try {
        const expense = await Expense_1.Expense.findById(id);
        if (!expense) {
            res.status(404).json({ message: 'Expense not found' });
            return;
        }
        // Role check: Only creator or admins can delete
        if (expense.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden. You can only delete your own records.' });
            return;
        }
        await Expense_1.Expense.findByIdAndDelete(id);
        res.status(200).json({ success: true, id });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting expense' });
    }
};
exports.deleteExpense = deleteExpense;
