"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMockData = void 0;
const User_1 = require("../models/User");
const Category_1 = require("../models/Category");
const Expense_1 = require("../models/Expense");
const Income_1 = require("../models/Income");
const Budget_1 = require("../models/Budget");
const Emi_1 = require("../models/Emi");
const BorrowAccount_1 = require("../models/BorrowAccount");
const BorrowTransaction_1 = require("../models/BorrowTransaction");
const RoomRent_1 = require("../models/RoomRent");
const RoomBill_1 = require("../models/RoomBill");
const RoomInventory_1 = require("../models/RoomInventory");
const RoomPurchase_1 = require("../models/RoomPurchase");
const SavingsGoal_1 = require("../models/SavingsGoal");
const ActivityLog_1 = require("../models/ActivityLog");
const dayjs_1 = __importDefault(require("dayjs"));
const seedMockData = async () => {
    try {
        const admin = await User_1.User.findOne({ email: 'admin@example.com' });
        if (!admin) {
            console.log('Seed: Admin user not found. Skipping mockup data seed.');
            return;
        }
        const userId = admin.id;
        // Check if expenses already exist for this user
        const existingExpenses = await Expense_1.Expense.findOne({ createdBy: userId });
        if (existingExpenses) {
            console.log('Seed: Data already exists. Skipping database seeding.');
            return;
        }
        console.log('Seed: Initializing mock transaction data seeding...');
        // 1. Fetch categories
        const foodCat = await Category_1.Category.findOne({ name: 'Food' });
        const groceryCat = await Category_1.Category.findOne({ name: 'Grocery' });
        const zeptoCat = await Category_1.Category.findOne({ name: 'Zepto' });
        const travelCat = await Category_1.Category.findOne({ name: 'Travel' });
        const internetCat = await Category_1.Category.findOne({ name: 'Internet' });
        const electricityCat = await Category_1.Category.findOne({ name: 'Electricity' });
        const currentMonth = (0, dayjs_1.default)().format('YYYY-MM');
        const today = (0, dayjs_1.default)().format('YYYY-MM-DD');
        const yesterday = (0, dayjs_1.default)().subtract(1, 'day').format('YYYY-MM-DD');
        const pastDate = (0, dayjs_1.default)().subtract(5, 'day').format('YYYY-MM-DD');
        // 2. Seed Expenses
        if (foodCat && groceryCat && zeptoCat && travelCat && internetCat) {
            await Expense_1.Expense.insertMany([
                {
                    title: 'Zomato Dinner with Friends',
                    amount: 1450,
                    category: foodCat._id,
                    paymentMode: 'upi',
                    date: today,
                    time: '20:30',
                    notes: 'Dinner at Punjabi Rasoi',
                    tags: ['food', 'friends', 'dinner'],
                    createdBy: userId,
                },
                {
                    title: 'Zepto Weekly Groceries',
                    amount: 820,
                    category: zeptoCat._id,
                    paymentMode: 'upi',
                    date: today,
                    time: '09:15',
                    notes: 'Milk, eggs, fruits, bread',
                    tags: ['groceries', 'zepto'],
                    createdBy: userId,
                },
                {
                    title: 'Uber Cab Ride to Office',
                    amount: 320,
                    category: travelCat._id,
                    paymentMode: 'upi',
                    date: yesterday,
                    time: '09:30',
                    tags: ['office', 'travel'],
                    createdBy: userId,
                },
                {
                    title: 'ACT Fibernet WiFi Bill',
                    amount: 1050,
                    category: internetCat._id,
                    paymentMode: 'net_banking',
                    date: pastDate,
                    time: '12:00',
                    notes: 'Monthly high-speed internet subscription',
                    tags: ['bills', 'wifi'],
                    createdBy: userId,
                },
            ]);
            console.log('Seed: Expenses seeded successfully.');
        }
        // 3. Seed Income
        await Income_1.Income.insertMany([
            {
                source: 'salary',
                amount: 85000,
                date: (0, dayjs_1.default)().startOf('month').format('YYYY-MM-DD'),
                notes: 'Monthly corporate office salary credit',
                createdBy: userId,
            },
            {
                source: 'freelance',
                amount: 12500,
                date: yesterday,
                notes: 'Logo design project checkout',
                createdBy: userId,
            },
        ]);
        console.log('Seed: Income streams seeded.');
        // 4. Seed Budgets
        if (foodCat && groceryCat) {
            await Budget_1.Budget.insertMany([
                {
                    category: foodCat._id,
                    limitAmount: 8000,
                    month: currentMonth,
                    createdBy: userId,
                },
                {
                    category: groceryCat._id,
                    limitAmount: 5000,
                    month: currentMonth,
                    createdBy: userId,
                },
            ]);
            console.log('Seed: Category monthly budgets seeded.');
        }
        // 5. Seed EMIs
        await Emi_1.Emi.insertMany([
            {
                loanName: 'HDFC Home Loan',
                principal: 2500000,
                interestRate: 8.4,
                monthlyEmi: 22000,
                monthsTotal: 240,
                monthsPaid: 12,
                remainingBalance: 2430000,
                dueDate: (0, dayjs_1.default)().add(15, 'day').format('YYYY-MM-DD'),
                startDate: (0, dayjs_1.default)().subtract(12, 'month').format('YYYY-MM-DD'),
                createdBy: userId,
            },
            {
                loanName: 'Apple iPhone 15 EMI',
                principal: 80000,
                interestRate: 0,
                monthlyEmi: 6667,
                monthsTotal: 12,
                monthsPaid: 4,
                remainingBalance: 53332,
                dueDate: (0, dayjs_1.default)().add(5, 'day').format('YYYY-MM-DD'),
                startDate: (0, dayjs_1.default)().subtract(4, 'month').format('YYYY-MM-DD'),
                createdBy: userId,
            },
        ]);
        console.log('Seed: Loan EMIs configured.');
        // 6. Seed Borrow accounts and transactions
        const friendAcc = new BorrowAccount_1.BorrowAccount({
            name: 'John Doe',
            phone: '+919876543210',
            status: 'pending',
            createdBy: userId,
        });
        await friendAcc.save();
        const seedBorrowTx = new BorrowTransaction_1.BorrowTransaction({
            account: friendAcc._id,
            type: 'borrowed',
            amount: 5000,
            date: yesterday,
            notes: 'Borrowed for weekend travel expenses',
            createdBy: userId,
        });
        await seedBorrowTx.save();
        const seedPaidTx = new BorrowTransaction_1.BorrowTransaction({
            account: friendAcc._id,
            type: 'paid_borrow',
            amount: 2000,
            date: today,
            notes: 'Partial settlement payback UPI',
            createdBy: userId,
            parentTransaction: seedBorrowTx._id,
        });
        await seedPaidTx.save();
        console.log('Seed: Borrow/Lent ledger populated.');
        // 7. Seed Room rents and bills
        await RoomRent_1.RoomRent.create({
            month: currentMonth,
            rentAmount: 8500,
            isPaid: false,
            dueDate: (0, dayjs_1.default)().add(7, 'day').format('YYYY-MM-DD'),
            createdBy: userId,
        });
        if (electricityCat) {
            await RoomBill_1.RoomBill.create({
                month: currentMonth,
                type: 'electricity',
                amount: 1450,
                units: 180,
                isPaid: false,
                dueDate: (0, dayjs_1.default)().add(10, 'day').format('YYYY-MM-DD'),
                createdBy: userId,
            });
        }
        // 8. Seed Room inventories and purchases
        await RoomInventory_1.RoomInventory.insertMany([
            { item: 'fan', customName: 'Crompton Ceiling Fan', quantity: 2, status: 'working', createdBy: userId },
            { item: 'induction', customName: 'Prestige Induction Stove', quantity: 1, status: 'working', createdBy: userId },
            { item: 'chair', customName: 'Wooden Study Chairs', quantity: 4, status: 'working', createdBy: userId },
        ]);
        await RoomPurchase_1.RoomPurchase.create({
            name: 'LPG Gas Cylinder Refill',
            price: 950,
            quantity: 1,
            shop: 'HP Gas agency',
            date: yesterday,
            category: 'gas',
            createdBy: userId,
        });
        console.log('Seed: Shared room items configured.');
        // 9. Seed Savings Goal
        await SavingsGoal_1.SavingsGoal.create({
            title: 'Emergency Fund 2026',
            targetAmount: 150000,
            currentAmount: 35000,
            targetDate: (0, dayjs_1.default)().add(6, 'month').format('YYYY-MM-DD'),
            interval: 'monthly',
            createdBy: userId,
        });
        console.log('Seed: Savings goal configured.');
        // 10. Seed Activity Log Entries for Audit
        await ActivityLog_1.ActivityLog.insertMany([
            { action: 'ADMIN_SEED', description: 'System database seeded with mock financial logs.', user: userId },
            { action: 'USER_REGISTER', description: 'System Administrator registered with admin clearance.', user: userId },
            { action: 'SETTINGS_UPDATE', description: 'Global currency set to INR.', user: userId },
        ]);
        console.log('Seed: Activity logs configured.');
        console.log('Seed: Completed database seeding successfully.');
    }
    catch (error) {
        console.error('Seed: Error seeding initial database:', error);
    }
};
exports.seedMockData = seedMockData;
