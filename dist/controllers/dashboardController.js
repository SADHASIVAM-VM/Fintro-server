"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const Expense_1 = require("../models/Expense");
const Income_1 = require("../models/Income");
const Budget_1 = require("../models/Budget");
const Emi_1 = require("../models/Emi");
const BorrowAccount_1 = require("../models/BorrowAccount");
const BorrowTransaction_1 = require("../models/BorrowTransaction");
const RoomRent_1 = require("../models/RoomRent");
const RoomBill_1 = require("../models/RoomBill");
const RoomPurchase_1 = require("../models/RoomPurchase");
const User_1 = require("../models/User");
const ActivityLog_1 = require("../models/ActivityLog");
const Category_1 = require("../models/Category");
const dayjs_1 = __importDefault(require("dayjs"));
const getDashboardData = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const userId = req.user.id;
    const today = (0, dayjs_1.default)().format('YYYY-MM-DD');
    const currentMonth = (0, dayjs_1.default)().format('YYYY-MM');
    // Past 6 months list for charts
    const trendMonths = Array.from({ length: 6 }).map((_, i) => (0, dayjs_1.default)().subtract(5 - i, 'month').format('YYYY-MM'));
    const trendStartDate = `${trendMonths[0]}-01`;
    // --- ADMIN ROLE CHECK ---
    if (req.user.role === 'admin') {
        try {
            const totalUsers = await User_1.User.countDocuments({});
            const totalCategoriesCount = await Category_1.Category.countDocuments({});
            // Calculate global totals using aggregate to prevent loading full collections
            const totalExpensesAgg = await Expense_1.Expense.aggregate([
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalExpensesSum = totalExpensesAgg[0]?.total || 0;
            const totalIncomesAgg = await Income_1.Income.aggregate([
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalIncomesSum = totalIncomesAgg[0]?.total || 0;
            // Category breakdown (Global) - Aggregate directly in MongoDB
            const categoryPie = await Expense_1.Expense.aggregate([
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
            const globalExpensesRange = await Expense_1.Expense.find({ date: { $gte: trendStartDate } })
                .select('amount date')
                .lean();
            const globalIncomesRange = await Income_1.Income.find({ date: { $gte: trendStartDate } })
                .select('amount date')
                .lean();
            const monthlyTrend = trendMonths.map((m) => {
                const mExps = globalExpensesRange.filter(e => e.date.startsWith(m));
                const mIncs = globalIncomesRange.filter(i => i.date.startsWith(m));
                const expSum = mExps.reduce((sum, item) => sum + item.amount, 0);
                const incSum = mIncs.reduce((sum, item) => sum + item.amount, 0);
                return {
                    name: (0, dayjs_1.default)(m + '-01').format('MMM'),
                    value: expSum,
                    income: incSum,
                    savings: Math.max(0, incSum - expSum),
                };
            });
            // Latest Audit activities from ActivityLog
            const latestActivities = await ActivityLog_1.ActivityLog.find({})
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
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Error compiling admin stats' });
            return;
        }
    }
    // --- STANDARD USER ROLE FLOW ---
    try {
        // 1. TODAY'S EXPENSE
        const todayExpenses = await Expense_1.Expense.find({
            createdBy: userId,
            date: today,
        }).lean();
        const todayExpenseSum = todayExpenses.reduce((sum, item) => sum + item.amount, 0);
        // Calculate today-vs-yesterday comparison
        const yesterday = (0, dayjs_1.default)().subtract(1, 'day').format('YYYY-MM-DD');
        const yesterdayExpenses = await Expense_1.Expense.find({ createdBy: userId, date: yesterday }).lean();
        const yesterdaySum = yesterdayExpenses.reduce((sum, item) => sum + item.amount, 0);
        const todayVsYesterday = yesterdaySum > 0 ? Math.round(((todayExpenseSum - yesterdaySum) / yesterdaySum) * 100) : 0;
        // 2. MONTHLY EXPENSE
        const monthlyExpenses = await Expense_1.Expense.find({
            createdBy: userId,
            date: { $regex: `^${currentMonth}` },
        }).populate('category', 'name color icon').lean();
        const monthlyExpenseSum = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
        // 3. MONTHLY INCOME
        const monthlyIncomes = await Income_1.Income.find({
            createdBy: userId,
            date: { $regex: `^${currentMonth}` },
        }).lean();
        const monthlyIncomeSum = monthlyIncomes.reduce((sum, item) => sum + item.amount, 0);
        // 4. SAVINGS (Income - Expense)
        const netSavings = Math.max(0, monthlyIncomeSum - monthlyExpenseSum);
        // 5. BUDGET REMAINING
        const monthlyBudgets = await Budget_1.Budget.find({
            createdBy: userId,
            month: currentMonth,
        }).lean();
        const totalBudgetLimit = monthlyBudgets.reduce((sum, item) => sum + item.limitAmount, 0);
        const remainingBudget = Math.max(0, totalBudgetLimit - monthlyExpenseSum);
        const budgetUsedPercent = totalBudgetLimit > 0 ? Math.round((monthlyExpenseSum / totalBudgetLimit) * 100) : 0;
        // 6. UPCOMING EMIS
        const activeEmis = await Emi_1.Emi.find({ createdBy: userId }).lean();
        const upcomingEmiSum = activeEmis.reduce((sum, item) => {
            if (item.monthsPaid < item.monthsTotal) {
                return sum + item.monthlyEmi;
            }
            return sum;
        }, 0);
        // 7. BORROW VS LENT OUTSTANDING - Optimized to resolve N+1 queries
        const accounts = await BorrowAccount_1.BorrowAccount.find({ createdBy: userId }).lean();
        const accountIds = accounts.map(acc => acc._id);
        // Batch fetch all transactions for all accounts
        const allBorrowTxs = await BorrowTransaction_1.BorrowTransaction.find({ account: { $in: accountIds } }).lean();
        // Map transactions to their account keys
        const txsByAccount = allBorrowTxs.reduce((map, tx) => {
            const key = tx.account.toString();
            if (!map[key])
                map[key] = [];
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
            txs.forEach((t) => {
                if (t.type === 'borrowed')
                    totalB += t.amount;
                else if (t.type === 'lent')
                    totalL += t.amount;
                else if (t.type === 'paid_borrow')
                    paidB += t.amount;
                else if (t.type === 'paid_lent')
                    paidL += t.amount;
            });
            borrowedOutstanding += Math.max(0, totalB - paidB);
            lentOutstanding += Math.max(0, totalL - paidL);
        }
        // 8. ROOM STATUS & PURCHASES
        const roomRent = await RoomRent_1.RoomRent.findOne({ createdBy: userId, month: currentMonth }).lean();
        const roomBills = await RoomBill_1.RoomBill.find({ createdBy: userId, month: currentMonth }).lean();
        const todayPurchases = await RoomPurchase_1.RoomPurchase.countDocuments({ createdBy: userId, date: today });
        const rentStatus = roomRent ? (roomRent.isPaid ? 'Paid' : 'Pending') : 'Unassigned';
        const billsStatus = roomBills.length > 0
            ? (roomBills.every((b) => b.isPaid) ? 'All Paid' : 'Pending Dues')
            : 'No Bills';
        // 9. CHARTS DATA GENERATION
        // Category Breakdown in-memory using populated lean results
        const categoryMap = {};
        monthlyExpenses.forEach((exp) => {
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
        const userExpensesRange = await Expense_1.Expense.find({ createdBy: userId, date: { $gte: trendStartDate } })
            .select('amount date')
            .lean();
        const userIncomesRange = await Income_1.Income.find({ createdBy: userId, date: { $gte: trendStartDate } })
            .select('amount date')
            .lean();
        const userPurchasesRange = await RoomPurchase_1.RoomPurchase.find({ createdBy: userId, date: { $gte: trendStartDate } })
            .select('price quantity date')
            .lean();
        const monthlyTrend = trendMonths.map((m) => {
            const mExps = userExpensesRange.filter(e => e.date.startsWith(m));
            const mIncs = userIncomesRange.filter(i => i.date.startsWith(m));
            const mPurchases = userPurchasesRange.filter(p => p.date.startsWith(m));
            const expSum = mExps.reduce((sum, item) => sum + item.amount, 0);
            const incSum = mIncs.reduce((sum, item) => sum + item.amount, 0);
            const purchaseSum = mPurchases.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
            const occupancyValues = [50, 52, 55, 58, 52, 54];
            const monthIndex = trendMonths.indexOf(m);
            const occupancy = monthIndex !== -1 ? occupancyValues[monthIndex] : 52;
            return {
                name: (0, dayjs_1.default)(m + '-01').format('MMM'),
                expenses: expSum,
                income: incSum,
                purchases: purchaseSum,
                savings: Math.max(0, incSum - expSum),
                occupancy,
            };
        });
        // Weekly Comparison Chart data
        const weekDays = Array.from({ length: 7 }).map((_, i) => (0, dayjs_1.default)().subtract(6 - i, 'day'));
        const weeklyComparison = weekDays.map((day) => {
            const dayStr = day.format('YYYY-MM-DD');
            const prevDayStr = day.subtract(7, 'day').format('YYYY-MM-DD');
            const dayExps = userExpensesRange.filter(e => e.date === dayStr);
            const prevDayExps = userExpensesRange.filter(e => e.date === prevDayStr);
            return {
                dayLabel: day.format('MMM DD'),
                currentWeek: dayExps.reduce((sum, item) => sum + item.amount, 0),
                previousWeek: prevDayExps.reduce((sum, item) => sum + item.amount, 0),
            };
        });
        // 10. RECENT ACTIVITY LIST
        const latestExpenses = await Expense_1.Expense.find({ createdBy: userId })
            .populate('category', 'name color icon')
            .sort({ date: -1, createdAt: -1 })
            .limit(5)
            .lean();
        const latestRoomPurchases = await RoomPurchase_1.RoomPurchase.find({ createdBy: userId })
            .sort({ date: -1, createdAt: -1 })
            .limit(5)
            .lean();
        res.status(200).json({
            stats: {
                todayExpense: { value: todayExpenseSum, changePercent: todayVsYesterday },
                monthlyExpense: { value: monthlyExpenseSum, budgetUsedPercent, totalBudgetLimit },
                income: { value: monthlyIncomeSum },
                savings: { value: netSavings },
                remainingBudget: { value: remainingBudget },
                upcomingEmi: { value: upcomingEmiSum },
                borrowedOutstanding: { value: borrowedOutstanding },
                lentOutstanding: { value: lentOutstanding },
                roomRentStatus: { value: rentStatus },
                roomBillsStatus: { value: billsStatus },
                todayPurchases: { value: todayPurchases },
                occupiedRooms: { value: 42, total: 80, percent: 52 },
            },
            charts: {
                expenseCategory: categoryPie,
                monthlyTrend,
                weeklyComparison,
            },
            recentActivity: {
                expenses: latestExpenses,
                roomPurchases: latestRoomPurchases,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error compiling dashboard statistics' });
    }
};
exports.getDashboardData = getDashboardData;
