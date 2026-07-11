"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportExpensesCSV = void 0;
const Expense_1 = require("../models/Expense");
// Export expenses to CSV format
const exportExpensesCSV = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const userId = req.user.id;
    try {
        const query = req.user.role === 'admin' ? {} : { createdBy: userId };
        const expenses = await Expense_1.Expense.find(query).populate('category', 'name');
        let csv = 'ID,Title,Amount,Category,Payment Mode,Date,Time,Notes,Tags\n';
        expenses.forEach((e) => {
            const tagsStr = e.tags ? e.tags.join(';') : '';
            const catName = e.category ? e.category.name : 'Unassigned';
            const safeTitle = (e.title || '').replace(/"/g, '""');
            const safeNotes = (e.notes || '').replace(/"/g, '""');
            csv += `"${e._id}","${safeTitle}",${e.amount},"${catName}","${e.paymentMode}","${e.date}","${e.time || ''}","${safeNotes}","${tagsStr}"\n`;
        });
        res.setHeader('Content-disposition', 'attachment; filename=expenses-report.csv');
        res.setHeader('Content-type', 'text/csv');
        res.status(200).send(csv);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error compiling CSV report' });
    }
};
exports.exportExpensesCSV = exportExpensesCSV;
exports.default = exports.exportExpensesCSV;
