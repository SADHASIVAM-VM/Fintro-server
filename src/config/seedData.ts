import { User } from '../models/User';
import { Category } from '../models/Category';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { Budget } from '../models/Budget';
import { Emi } from '../models/Emi';
import { BorrowAccount } from '../models/BorrowAccount';
import { BorrowTransaction } from '../models/BorrowTransaction';
import { RoomRent } from '../models/RoomRent';
import { RoomBill } from '../models/RoomBill';
import { RoomInventory } from '../models/RoomInventory';
import { RoomPurchase } from '../models/RoomPurchase';
import { SavingsGoal } from '../models/SavingsGoal';
import { ActivityLog } from '../models/ActivityLog';
import dayjs from 'dayjs';

export const seedMockData = async () => {
  try {
    const admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      console.log('Seed: Admin user not found. Skipping mockup data seed.');
      return;
    }

    const userId = admin.id;

    // Check if expenses already exist for this user
    const existingExpenses = await Expense.findOne({ createdBy: userId });
    if (existingExpenses) {
      console.log('Seed: Data already exists. Skipping database seeding.');
      return;
    }

    console.log('Seed: Initializing mock transaction data seeding...');

    // 1. Fetch categories
    const foodCat = await Category.findOne({ name: 'Food' });
    const groceryCat = await Category.findOne({ name: 'Grocery' });
    const zeptoCat = await Category.findOne({ name: 'Zepto' });
    const travelCat = await Category.findOne({ name: 'Travel' });
    const internetCat = await Category.findOne({ name: 'Internet' });
    const electricityCat = await Category.findOne({ name: 'Electricity' });

    const currentMonth = dayjs().format('YYYY-MM');
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const pastDate = dayjs().subtract(5, 'day').format('YYYY-MM-DD');

    // 2. Seed Expenses
    if (foodCat && groceryCat && zeptoCat && travelCat && internetCat) {
      await Expense.insertMany([
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
    await Income.insertMany([
      {
        source: 'salary',
        amount: 85000,
        date: dayjs().startOf('month').format('YYYY-MM-DD'),
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
      await Budget.insertMany([
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
    await Emi.insertMany([
      {
        loanName: 'HDFC Home Loan',
        principal: 2500000,
        interestRate: 8.4,
        monthlyEmi: 22000,
        monthsTotal: 240,
        monthsPaid: 12,
        remainingBalance: 2430000,
        dueDate: dayjs().add(15, 'day').format('YYYY-MM-DD'),
        startDate: dayjs().subtract(12, 'month').format('YYYY-MM-DD'),
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
        dueDate: dayjs().add(5, 'day').format('YYYY-MM-DD'),
        startDate: dayjs().subtract(4, 'month').format('YYYY-MM-DD'),
        createdBy: userId,
      },
    ]);
    console.log('Seed: Loan EMIs configured.');

    // 6. Seed Borrow accounts and transactions
    const friendAcc = new BorrowAccount({
      name: 'John Doe',
      phone: '+919876543210',
      status: 'pending',
      createdBy: userId,
    });
    await friendAcc.save();

    const seedBorrowTx = new BorrowTransaction({
      account: friendAcc._id,
      type: 'borrowed',
      amount: 5000,
      date: yesterday,
      notes: 'Borrowed for weekend travel expenses',
      createdBy: userId,
    });
    await seedBorrowTx.save();

    const seedPaidTx = new BorrowTransaction({
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
    await RoomRent.create({
      month: currentMonth,
      rentAmount: 8500,
      isPaid: false,
      dueDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      createdBy: userId,
    });

    if (electricityCat) {
      await RoomBill.create({
        month: currentMonth,
        type: 'electricity',
        amount: 1450,
        units: 180,
        isPaid: false,
        dueDate: dayjs().add(10, 'day').format('YYYY-MM-DD'),
        createdBy: userId,
      });
    }

    // 8. Seed Room inventories and purchases
    await RoomInventory.insertMany([
      { item: 'fan', customName: 'Crompton Ceiling Fan', quantity: 2, status: 'working', createdBy: userId },
      { item: 'induction', customName: 'Prestige Induction Stove', quantity: 1, status: 'working', createdBy: userId },
      { item: 'chair', customName: 'Wooden Study Chairs', quantity: 4, status: 'working', createdBy: userId },
    ]);

    await RoomPurchase.create({
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
    await SavingsGoal.create({
      title: 'Emergency Fund 2026',
      targetAmount: 150000,
      currentAmount: 35000,
      targetDate: dayjs().add(6, 'month').format('YYYY-MM-DD'),
      interval: 'monthly',
      createdBy: userId,
    });
    console.log('Seed: Savings goal configured.');

    // 10. Seed Activity Log Entries for Audit
    await ActivityLog.insertMany([
      { action: 'ADMIN_SEED', description: 'System database seeded with mock financial logs.', user: userId },
      { action: 'USER_REGISTER', description: 'System Administrator registered with admin clearance.', user: userId },
      { action: 'SETTINGS_UPDATE', description: 'Global currency set to INR.', user: userId },
    ]);
    console.log('Seed: Activity logs configured.');

    console.log('Seed: Completed database seeding successfully.');
  } catch (error) {
    console.error('Seed: Error seeding initial database:', error);
  }
};
