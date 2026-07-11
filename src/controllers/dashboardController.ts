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

  // Past 6 months list for charts
  const trendMonths = Array.from({ length: 6 }).map((_, i) =>
    dayjs().subtract(5 - i, 'month').format('YYYY-MM')
  );
  const trendStartDate = `${trendMonths[0]}-01`;

  // --- ADMIN ROLE CHECK ---
  if (req.user.role === 'admin') {
    try {
      const totalUsers = await User.countDocuments({});
      const totalCategoriesCount = await Category.countDocuments({});

      // Calculate global totals using aggregate to prevent loading full collections
      const totalExpensesAgg = await Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalExpensesSum = totalExpensesAgg[0]?.total || 0;

      const totalIncomesAgg = await Income.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalIncomesSum = totalIncomesAgg[0]?.total || 0;

      // Category breakdown (Global) - Aggregate directly in MongoDB
      const categoryPie = await Expense.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'catDoc'
          }
        },
        { $unwind: '$catDoc' },
        {
          $group: {
            _id: '$catDoc.name',
            value: { $sum: '$amount' },
            color: { $first: '$catDoc.color' }
          }
        },
        {
          $project: {
            _id: 0,
            name: '$_id',
            value: 1,
            color: { $ifNull: ['$color', '#cccccc'] }
          }
        }
      ]);

      // Monthly Trend (Past 6 Months - Global) - Load raw data within range using lean queries
      const globalExpensesRange = await Expense.find({ date: { $gte: trendStartDate } })
        .select('amount date')
        .lean();
      
      const globalIncomesRange = await Income.find({ date: { $gte: trendStartDate } })
        .select('amount date')
        .lean();

      const monthlyTrend = trendMonths.map((m) => {
        const mExps = globalExpensesRange.filter(e => e.date.startsWith(m));
        const mIncs = globalIncomesRange.filter(i => i.date.startsWith(m));
        const expSum = mExps.reduce((sum, item) => sum + item.amount, 0);
        const incSum = mIncs.reduce((sum, item) => sum + item.amount, 0);

        return {
          name: dayjs(m + '-01').format('MMM'),
          value: expSum,
          income: incSum,
          savings: Math.max(0, incSum - expSum),
        };
      });

      // Latest Audit activities from ActivityLog
      const latestActivities = await ActivityLog.find({})
        .populate('user', 'name email avatar')
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();

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
    }).lean();
    const todayExpenseSum = todayExpenses.reduce((sum, item) => sum + item.amount, 0);

    // 2. MONTHLY EXPENSE
    const monthlyExpenses = await Expense.find({
      createdBy: userId,
      date: { $regex: `^${currentMonth}` },
    }).populate('category', 'name color icon').lean();
    const monthlyExpenseSum = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);

    // 3. MONTHLY INCOME
    const monthlyIncomes = await Income.find({
      createdBy: userId,
      date: { $regex: `^${currentMonth}` },
    }).lean();
    const monthlyIncomeSum = monthlyIncomes.reduce((sum, item) => sum + item.amount, 0);

    // 4. SAVINGS (Income - Expense)
    const netSavings = Math.max(0, monthlyIncomeSum - monthlyExpenseSum);

    // 5. BUDGET REMAINING
    const monthlyBudgets = await Budget.find({
      createdBy: userId,
      month: currentMonth,
    }).lean();
    const totalBudgetLimit = monthlyBudgets.reduce((sum, item) => sum + item.limitAmount, 0);
    const remainingBudget = Math.max(0, totalBudgetLimit - monthlyExpenseSum);

    // 6. UPCOMING EMIS
    const activeEmis = await Emi.find({ createdBy: userId }).lean();
    const upcomingEmiSum = activeEmis.reduce((sum, item) => {
      if (item.monthsPaid < item.monthsTotal) {
        return sum + item.monthlyEmi;
      }
      return sum;
    }, 0);

    // 7. BORROW VS LENT OUTSTANDING - Optimized to resolve N+1 queries
    const accounts = await BorrowAccount.find({ createdBy: userId }).lean();
    const accountIds = accounts.map(acc => acc._id);
    
    // Batch fetch all transactions for all accounts
    const allBorrowTxs = await BorrowTransaction.find({ account: { $in: accountIds } }).lean();
    
    // Map transactions to their account keys
    const txsByAccount = allBorrowTxs.reduce((map: any, tx) => {
      const key = tx.account.toString();
      if (!map[key]) map[key] = [];
      map[key].push(tx);
      return map;
    }, {});

    let borrowedOutstanding = 0;
    let lentOutstanding = 0;

    for (const acc of accounts) {
      const txs = txsByAccount[acc._id.toString()] || [];
      let totalB = 0;
      let totalL = 0;
      let paidB = 0;
      let paidL = 0;

      txs.forEach((t: any) => {
        if (t.type === 'borrowed') totalB += t.amount;
        else if (t.type === 'lent') totalL += t.amount;
        else if (t.type === 'paid_borrow') paidB += t.amount;
        else if (t.type === 'paid_lent') paidL += t.amount;
      });

      borrowedOutstanding += Math.max(0, totalB - paidB);
      lentOutstanding += Math.max(0, totalL - paidL);
    }

    // 8. ROOM STATUS
    const roomRent = await RoomRent.findOne({ createdBy: userId, month: currentMonth }).lean();
    const roomBills = await RoomBill.find({ createdBy: userId, month: currentMonth }).lean();

    const rentStatus = roomRent ? (roomRent.isPaid ? 'Paid' : 'Pending') : 'Unassigned';
    const billsStatus = roomBills.length > 0
      ? (roomBills.every((b) => b.isPaid) ? 'All Paid' : 'Pending Dues')
      : 'No Bills';

    // 9. CHARTS DATA GENERATION
    // Category Breakdown in-memory using populated lean results
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

    // Monthly Trend (Past 6 Months) - Optimized to perform only 2 database queries
    const userExpensesRange = await Expense.find({ createdBy: userId, date: { $gte: trendStartDate } })
      .select('amount date')
      .lean();

    const userIncomesRange = await Income.find({ createdBy: userId, date: { $gte: trendStartDate } })
      .select('amount date')
      .lean();

    const monthlyTrend = trendMonths.map((m) => {
      const mExps = userExpensesRange.filter(e => e.date.startsWith(m));
      const mIncs = userIncomesRange.filter(i => i.date.startsWith(m));
      const expSum = mExps.reduce((sum, item) => sum + item.amount, 0);
      const incSum = mIncs.reduce((sum, item) => sum + item.amount, 0);
      
      return {
        name: dayjs(m + '-01').format('MMM'),
        value: expSum,
        income: incSum,
        savings: Math.max(0, incSum - expSum),
      };
    });

    // 10. RECENT ACTIVITY LIST
    const latestExpenses = await Expense.find({ createdBy: userId })
      .populate('category', 'name color icon')
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();

    const latestRoomPurchases = await RoomPurchase.find({ createdBy: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();

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
