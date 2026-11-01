import mongoose from 'mongoose';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { User, IUser } from '../models/User';
import { Expense } from '../models/Expense';
import { Settings } from '../models/Settings';
import { Notification } from '../models/Notification';
import {
  sendEmail,
  generateWeeklyReviewEmailHtml,
  WeeklyReviewTemplateData,
} from './email.service';

dayjs.extend(isoWeek);

export interface WeeklyReviewResult {
  userId: string;
  email: string;
  success: boolean;
  skipped?: boolean;
  reason?: string;
  data?: WeeklyReviewTemplateData;
}

/**
 * Calculates weekly spending metrics for a specific user
 */
export const getWeeklyReviewDataForUser = async (
  userId: string | mongoose.Types.ObjectId,
  targetDate?: string
): Promise<WeeklyReviewTemplateData | null> => {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const refDate = targetDate ? dayjs(targetDate) : dayjs();

  // Current ISO Week: Monday to Sunday
  const thisWeekStart = refDate.startOf('isoWeek').format('YYYY-MM-DD');
  const thisWeekEnd = refDate.endOf('isoWeek').format('YYYY-MM-DD');

  // Previous ISO Week: Monday to Sunday
  const prevWeekStart = refDate.subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD');
  const prevWeekEnd = refDate.subtract(1, 'week').endOf('isoWeek').format('YYYY-MM-DD');

  const todayDate = refDate.format('YYYY-MM-DD');
  const weekRange = `${dayjs(thisWeekStart).format('MMM D')} – ${dayjs(thisWeekEnd).format('MMM D, YYYY')}`;

  // Fetch User Settings
  const settings = await Settings.findOne({ user: userId }).lean();
  const currency = settings?.currency === 'USD' ? '$' : '₹';

  // Fetch Current Week Expenses
  const thisWeekExpenses = await Expense.find({
    createdBy: userId,
    date: { $gte: thisWeekStart, $lte: thisWeekEnd },
  })
    .populate('category')
    .sort({ amount: -1 })
    .lean();

  // Fetch Previous Week Expenses
  const prevWeekExpenses = await Expense.find({
    createdBy: userId,
    date: { $gte: prevWeekStart, $lte: prevWeekEnd },
  }).lean();

  // Computations
  const thisWeekSpend = thisWeekExpenses.reduce((sum, exp: any) => sum + (Number(exp.amount) || 0), 0);
  const prevWeekSpend = prevWeekExpenses.reduce((sum, exp: any) => sum + (Number(exp.amount) || 0), 0);

  const todaySpend = thisWeekExpenses
    .filter((exp: any) => exp.date === todayDate)
    .reduce((sum, exp: any) => sum + (Number(exp.amount) || 0), 0);

  let percentChange: number | null = null;
  let isIncrease = false;
  if (prevWeekSpend > 0) {
    const diff = thisWeekSpend - prevWeekSpend;
    percentChange = Math.abs((diff / prevWeekSpend) * 100);
    isIncrease = diff > 0;
  }

  // Category Aggregation for this week
  const categoryMap = new Map<string, { name: string; amount: number; color?: string }>();
  for (const exp of thisWeekExpenses) {
    const catDoc = exp.category as any;
    const catName = catDoc?.name || 'Uncategorized';
    const catColor = catDoc?.color || '#8B5CF6';
    const existing = categoryMap.get(catName);
    if (existing) {
      existing.amount += Number(exp.amount) || 0;
    } else {
      categoryMap.set(catName, { name: catName, amount: Number(exp.amount) || 0, color: catColor });
    }
  }

  let topCategory: { name: string; amount: number; percentage: number; color?: string } | null = null;
  if (categoryMap.size > 0 && thisWeekSpend > 0) {
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);
    const top = sortedCategories[0];
    topCategory = {
      name: top.name,
      amount: top.amount,
      percentage: (top.amount / thisWeekSpend) * 100,
      color: top.color,
    };
  }

  // Top 3 Transactions this week
  const topExpenses = thisWeekExpenses.slice(0, 3).map((exp: any) => ({
    title: exp.title,
    amount: Number(exp.amount) || 0,
    date: exp.date,
    categoryName: (exp.category as any)?.name,
  }));

  // Monthly Budget Check
  let monthlyBudget: { limit: number; spentThisMonth: number; percentage: number } | null = null;
  if (settings?.budgetLimits && settings.budgetLimits > 0) {
    const currentMonthPrefix = refDate.format('YYYY-MM');
    const monthExpenses = await Expense.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId.toString()),
          date: { $regex: `^${currentMonthPrefix}` },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    const spentThisMonth = monthExpenses[0]?.total || 0;
    monthlyBudget = {
      limit: settings.budgetLimits,
      spentThisMonth,
      percentage: (spentThisMonth / settings.budgetLimits) * 100,
    };
  }

  return {
    userName: user.name || 'Fintro Member',
    weekRange,
    currency,
    todaySpend,
    thisWeekSpend,
    prevWeekSpend,
    percentChange,
    isIncrease,
    topCategory,
    topExpenses,
    monthlyBudget,
  };
};

/**
 * Sends a weekly review email to an individual user
 */
export const sendWeeklyReviewForUser = async (
  userId: string | mongoose.Types.ObjectId,
  targetDate?: string,
  force: boolean = false
): Promise<WeeklyReviewResult> => {
  const user = await User.findById(userId).lean();
  if (!user || !user.email) {
    return {
      userId: userId.toString(),
      email: user?.email || '',
      success: false,
      skipped: true,
      reason: 'User or email not found',
    };
  }

  // Check user preference
  const settings = await Settings.findOne({ user: userId }).lean();
  if (!force && settings?.notificationFlags?.weeklyEmailReview === false) {
    return {
      userId: user._id.toString(),
      email: user.email,
      success: false,
      skipped: true,
      reason: 'User disabled weekly email review in settings',
    };
  }

  const reviewData = await getWeeklyReviewDataForUser(userId, targetDate);
  if (!reviewData) {
    return {
      userId: user._id.toString(),
      email: user.email,
      success: false,
      skipped: true,
      reason: 'Could not generate review data',
    };
  }

  const html = generateWeeklyReviewEmailHtml(reviewData);

  await sendEmail({
    to: user.email,
    subject: `Weekly Financial Review: ${reviewData.weekRange}`,
    html,
  });

  // Log in user notifications
  try {
    const today = dayjs(targetDate).format('YYYY-MM-DD');
    await Notification.create({
      type: 'system',
      title: 'Weekly Review Dispatched',
      message: `Your weekly spending review for ${reviewData.weekRange} has been delivered to ${user.email}.`,
      date: today,
      isRead: false,
      createdBy: user._id,
    });
  } catch (notifErr: any) {
    console.warn('[WeeklyReview] Could not save notification:', notifErr.message);
  }

  return {
    userId: user._id.toString(),
    email: user.email,
    success: true,
    data: reviewData,
  };
};

/**
 * Runs the weekly review reminder for all registered users
 */
export const sendWeeklyReviewToAllUsers = async (
  targetDate?: string
): Promise<{ total: number; sent: number; skipped: number; failed: number }> => {
  console.log(`[WeeklyReview] Starting batch weekly review reminder process...`);
  const users = await User.find({}).lean();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const result = await sendWeeklyReviewForUser(user._id, targetDate);
      if (result.success) {
        sent++;
      } else if (result.skipped) {
        skipped++;
      } else {
        failed++;
      }
    } catch (err: any) {
      failed++;
      console.error(`[WeeklyReview] Failed to process weekly review for user ${user.email}:`, err.message);
    }
  }

  console.log(
    `[WeeklyReview] Completed batch. Total: ${users.length}, Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed}`
  );
  return { total: users.length, sent, skipped, failed };
};

