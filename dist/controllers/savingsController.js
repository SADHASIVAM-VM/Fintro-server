"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSavingsGoal = exports.updateSavingsProgress = exports.createSavingsGoal = exports.getSavingsGoals = void 0;
const SavingsGoal_1 = require("../models/SavingsGoal");
// GET GOALS
const getSavingsGoals = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
        const goals = await SavingsGoal_1.SavingsGoal.find(query).sort({ targetDate: 1 });
        res.status(200).json(goals);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error loading savings goals' });
    }
};
exports.getSavingsGoals = getSavingsGoals;
// CREATE SAVINGS GOAL
const createSavingsGoal = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { title, targetAmount, currentAmount, targetDate, interval } = req.body;
    try {
        const goal = new SavingsGoal_1.SavingsGoal({
            title,
            targetAmount: Number(targetAmount),
            currentAmount: Number(currentAmount) || 0,
            targetDate,
            interval,
            createdBy: req.user.id,
        });
        await goal.save();
        res.status(201).json(goal);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error creating savings goal' });
    }
};
exports.createSavingsGoal = createSavingsGoal;
// UPDATE SAVINGS PROGRESS
const updateSavingsProgress = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body; // Net cash adjustment (can be positive or negative)
    try {
        const goal = await SavingsGoal_1.SavingsGoal.findById(id);
        if (!goal) {
            res.status(404).json({ message: 'Savings goal not found' });
            return;
        }
        goal.currentAmount = Math.max(0, goal.currentAmount + Number(amount));
        await goal.save();
        res.status(200).json(goal);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error updating savings progress' });
    }
};
exports.updateSavingsProgress = updateSavingsProgress;
// DELETE GOAL
const deleteSavingsGoal = async (req, res) => {
    const { id } = req.params;
    try {
        const goal = await SavingsGoal_1.SavingsGoal.findByIdAndDelete(id);
        if (!goal) {
            res.status(404).json({ message: 'Savings goal not found' });
            return;
        }
        res.status(200).json({ success: true, id });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting savings goal' });
    }
};
exports.deleteSavingsGoal = deleteSavingsGoal;
