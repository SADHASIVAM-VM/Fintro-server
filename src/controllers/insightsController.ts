import { Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Subscription } from '../models/Subscription';
import { Budget } from '../models/Budget';
import { AuthenticatedRequest } from '../middleware/auth';
import { parseNaturalLanguageInput } from '../services/naturalLanguageParser';
import dayjs from 'dayjs';

// GET CALCULATED INSIGHTS & ANOMALY FLAGS
export const getFinancialInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const userId = req.user.id;
    const currentMonth = dayjs().format('YYYY-MM');
    const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD');

    // Fetch transactions for current month
    const currentMonthTransactions = await Transaction.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate('categoryId', 'name');

    const insights: string[] = [];

    // 1. Largest Expense Insight
    const expenses = currentMonthTransactions.filter((t) => t.type === 'EXPENSE');
    if (expenses.length > 0) {
      expenses.sort((a, b) => b.amount - a.amount);
      const largest = expenses[0];
      insights.push(`Your largest expense this month is "${largest.description}" (₹${largest.amount.toLocaleString()}).`);
    }

    // 2. Active Subscriptions Insight
    const activeSubscriptions = await Subscription.find({ userId, status: 'active' });
    const subMonthlyCost = activeSubscriptions.reduce(
      (sum, s) => sum + (s.billingCycle === 'yearly' ? s.cost / 12 : s.cost),
      0
    );
    if (subMonthlyCost > 0) {
      insights.push(`Your active subscriptions cost ₹${Math.round(subMonthlyCost).toLocaleString()} per month across ${activeSubscriptions.length} services.`);
    }

    // 3. Category Spending Insight
    const categoryTotals: Record<string, number> = {};
    for (const exp of expenses) {
      const catName = (exp.categoryId as any)?.name || 'General';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + exp.amount;
    }
    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      insights.push(`Top spending category this month: ${sortedCats[0][0]} (₹${sortedCats[0][1].toLocaleString()}).`);
    }

    // 4. Budget Adherence Insight
    const budgets = await Budget.find({ createdBy: userId, month: currentMonth });
    for (const b of budgets) {
      if (b.limitAmount > 0 && (categoryTotals['Food'] || 0) > b.limitAmount) {
        insights.push(`You have exceeded your monthly Food budget by ₹${Math.round(categoryTotals['Food'] - b.limitAmount)}.`);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        insights: insights.length > 0 ? insights : ['All financial metrics look healthy and within target bounds.'],
        totalCurrentMonthExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
        activeSubscriptionsCount: activeSubscriptions.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to generate financial insights' });
  }
};

// PARSE NATURAL LANGUAGE INPUT
export const parseNaturalInput = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ message: 'Natural language text input is required' });
      return;
    }

    const draft = parseNaturalLanguageInput(text);

    res.status(200).json({
      success: true,
      data: draft,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Natural language parsing failed' });
  }
};
