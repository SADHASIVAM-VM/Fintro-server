"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewWeeklyReview = exports.sendWeeklyReviewEmail = exports.exportExpensesCSV = void 0;
const Expense_1 = require("../models/Expense");
const weeklyReview_service_1 = require("../services/weeklyReview.service");
// Export expenses to CSV format
const exportExpensesCSV = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const userId = req.user.id;
    try {
        const query = req.user.role === 'admin' ? {} : { createdBy: userId };
        const expenses = await Expense_1.Expense.find(query).populate('category', 'name').lean();
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
// Trigger Weekly Review Reminder Email manually (test / on-demand)
const sendWeeklyReviewEmail = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { targetDate, all } = req.body || {};
    try {
        // If admin requests sending to all users
        if (all && req.user.role === 'admin') {
            const summary = await (0, weeklyReview_service_1.sendWeeklyReviewToAllUsers)(targetDate);
            res.status(200).json({
                message: 'Batch weekly review emails processed',
                summary,
            });
            return;
        }
        // Default: Send to the requesting individual user
        const result = await (0, weeklyReview_service_1.sendWeeklyReviewForUser)(req.user.id, targetDate, true);
        if (!result.success) {
            res.status(400).json({
                message: result.reason || 'Failed to dispatch weekly review email',
                result,
            });
            return;
        }
        res.status(200).json({
            message: `Weekly review email successfully sent to ${result.email}`,
            result,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || 'Error sending weekly review email',
        });
    }
};
exports.sendWeeklyReviewEmail = sendWeeklyReviewEmail;
// Preview Weekly Review Data without sending email
const previewWeeklyReview = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { targetDate } = req.query;
    try {
        const data = await (0, weeklyReview_service_1.getWeeklyReviewDataForUser)(req.user.id, targetDate);
        if (!data) {
            res.status(404).json({ message: 'No data found for user' });
            return;
        }
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching review preview' });
    }
};
exports.previewWeeklyReview = previewWeeklyReview;
exports.default = exports.exportExpensesCSV;
