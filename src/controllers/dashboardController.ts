import { Response } from 'express';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { Budget } from '../models/Budget';
import { Emi } from '../models/Emi';
import { BorrowAccount } from '../models/BorrowAccount';
import { BorrowTransaction } from '../models/BorrowTransaction';
import { RoomRent } from '../models/RoomRent';
import { RoomBill } from '../models/RoomBill';
import { RoomPurchase } from '../models/RoomPurchase';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { Category } from '../models/Category';
import dayjs from 'dayjs';

export const getDashboardData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const userId = req.user.id;
  const today = dayjs().format('YYYY-MM-DD');
  const currentMonth = dayjs().format('YYYY-MM');

  // --- ADMIN ROLE CHECK ---
  if (req.user.role === 'admin') {
    try {
      const totalUsers = await User.countDocuments({});
      const totalExpensesList = await Expense.find({});
      const totalExpensesSum = totalExpensesList.reduce((sum, item) => sum + item.amount, 0);

      const totalIncomesList = await Income.find({});
      const totalIncomesSum = totalIncomesList.reduce((sum, item) => sum + item.amount, 0);

      const totalCategoriesCount = await Category.countDocuments({});

      // Monthly Trend (Past 6 Months - Global)
      const trendMonths = Array.from({ length: 6 }).map((_, i) =>
        dayjs().subtract(5 - i, 'month').format('YYYY-MM')
      );
      
      const monthlyTrend = await Promise.all(
        trendMonths.map(async (m) => {
          const exps = await Expense.find({ date: { $regex: `^${m}` } });
          const incs = await Income.find({ date: { $regex: `^${m}` } });
          const expSum = exps.reduce((sum, item) => sum + item.amount, 0);
          const incSum = incs.reduce((sum, item) => sum + item.amount, 0);
          
          return {
            name: dayjs(m + '-01').format('MMM'),
            value: expSum,
            income: incSum,
            savings: Math.max(0, incSum - expSum),
          };
        })
      );

      // Category breakdown (Global)
      const categoryMap: Record<string, { value: number; color: string; name: string }> = {};
      const allExpenses = await Expense.find({}).populate('category', 'name color icon');
      allExpenses.forEach((exp: any) => {
        if (exp.category) {
          const catName = exp.category.name;
          const color = exp.category.color || '#cccccc';
          if (!categoryMap[catName]) {
            categoryMap[catName] = { name: catName, value: 0, color };
          }
          categoryMap[catName].value += exp.amount;
        }
      });
      const categoryPie = Object.values(categoryMap);

      // Latest Audit activities from ActivityLog
      const latestActivities = await ActivityLog.find({})
        .populate('user', 'name email avatar')
        .sort({ timestamp: -1 })
        .limit(10);

      res.status(200).json({
        isAdmin: true,
        stats: {
          totalUsers: { value: totalUsers },
          totalExpenses: { value: totalExpensesSum },
          totalIncome: { value: totalIncomesSum },
          totalCategories: { value: totalCategoriesCount },
        },
        charts: {
          expenseCategory: categoryPie,
          monthlyTrend,
        },
        recentActivity: {
          activities: latestActivities,
        },
      });
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Error compiling admin stats' });
      return;
    }
  }

  // --- STANDARD USER ROLE FLOW ---
  try {
    // 1. TODAY'S EXPENSE
    const todayExpenses = await Expense.find({
      createdBy: userId,
      date: today,
    });
    const todayExpenseSum = todayExpenses.reduce((sum, item) => sum + item.amount, 0);

    // 2. MONTHLY EXPENSE
    const monthlyExpenses = await Expense.find({
      createdBy: userId,
      date: { $regex: `^${currentMonth}` },
    }).populate('category', 'name color icon');
    const monthlyExpenseSum = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);

    // 3. MONTHLY INCOME
    const monthlyIncomes = await Income.find({
      createdBy: userId,
      date: { $regex: `^${currentMonth}` },
    });
    const monthlyIncomeSum = monthlyIncomes.reduce((sum, item) => sum + item.amount, 0);

    // 4. SAVINGS (Income - Expense)
    const netSavings = Math.max(0, monthlyIncomeSum - monthlyExpenseSum);

    // 5. BUDGET REMAINING
    const monthlyBudgets = await Budget.find({
      createdBy: userId,
      month: currentMonth,
    });
    const totalBudgetLimit = monthlyBudgets.reduce((sum, item) => sum + item.limitAmount, 0);
    const remainingBudget = Math.max(0, totalBudgetLimit - monthlyExpenseSum);

    // 6. UPCOMING EMIS
    const activeEmis = await Emi.find({ createdBy: userId });
    const upcomingEmiSum = activeEmis.reduce((sum, item) => {
      if (item.monthsPaid < item.monthsTotal) {
        return sum + item.monthlyEmi;
      }
      return sum;
    }, 0);

    // 7. BORROW VS LENT OUTSTANDING
    const accounts = await BorrowAccount.find({ createdBy: userId });
    let borrowedOutstanding = 0;
    let lentOutstanding = 0;

    for (const acc of accounts) {
      const txs = await BorrowTransaction.find({ account: acc.id });
      let totalB = 0;
      let totalL = 0;
      let paidB = 0;
      let paidL = 0;

      txs.forEach((t) => {
        if (t.type === 'borrowed') totalB += t.amount;
        else if (t.type === 'lent') totalL += t.amount;
        else if (t.type === 'paid_borrow') paidB += t.amount;
        else if (t.type === 'paid_lent') paidL += t.amount;
      });

      borrowedOutstanding += Math.max(0, totalB - paidB);
      lentOutstanding += Math.max(0, totalL - paidL);
    }

    // 8. ROOM STATUS
    const roomRent = await RoomRent.findOne({ createdBy: userId, month: currentMonth });
    const roomBills = await RoomBill.find({ createdBy: userId, month: currentMonth });

    const rentStatus = roomRent ? (roomRent.isPaid ? 'Paid' : 'Pending') : 'Unassigned';
    const billsStatus = roomBills.length > 0
      ? (roomBills.every((b) => b.isPaid) ? 'All Paid' : 'Pending Dues')
      : 'No Bills';

    // 9. CHARTS DATA GENERATION
    // Category Breakdown
    const categoryMap: Record<string, { value: number; color: string; name: string }> = {};
    monthlyExpenses.forEach((exp: any) => {
      if (exp.category) {
        const catName = exp.category.name;
        const color = exp.category.color || '#cccccc';
        if (!categoryMap[catName]) {
          categoryMap[catName] = { name: catName, value: 0, color };
        }
        categoryMap[catName].value += exp.amount;
      }
    });
    const categoryPie = Object.values(categoryMap);

    // Monthly Trend (Past 6 Months)
    const trendMonths = Array.from({ length: 6 }).map((_, i) =>
      dayjs().subtract(5 - i, 'month').format('YYYY-MM')
    );
    
    const monthlyTrend = await Promise.all(
      trendMonths.map(async (m) => {
        const exps = await Expense.find({ createdBy: userId, date: { $regex: `^${m}` } });
        const incs = await Income.find({ createdBy: userId, date: { $regex: `^${m}` } });
        const expSum = exps.reduce((sum, item) => sum + item.amount, 0);
        const incSum = incs.reduce((sum, item) => sum + item.amount, 0);
        
        return {
          name: dayjs(m + '-01').format('MMM'),
          value: expSum,
          income: incSum,
          savings: Math.max(0, incSum - expSum),
        };
      })
    );

    // 10. RECENT ACTIVITY LIST
    const latestExpenses = await Expense.find({ createdBy: userId })
      .populate('category', 'name color icon')
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    const latestRoomPurchases = await RoomPurchase.find({ createdBy: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    res.status(200).json({
      stats: {
        todayExpense: { value: todayExpenseSum },
        monthlyExpense: { value: monthlyExpenseSum },
        income: { value: monthlyIncomeSum },
        savings: { value: netSavings },
        remainingBudget: { value: remainingBudget },
        upcomingEmi: { value: upcomingEmiSum },
        borrowedOutstanding: { value: borrowedOutstanding },
        lentOutstanding: { value: lentOutstanding },
        roomRentStatus: { value: rentStatus },
        roomBillsStatus: { value: billsStatus },
      },
      charts: {
        expenseCategory: categoryPie,
        monthlyTrend,
      },
      recentActivity: {
        expenses: latestExpenses,
        roomPurchases: latestRoomPurchases,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error compiling dashboard statistics' });
  }
};
