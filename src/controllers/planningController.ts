import { Response } from 'express';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { RecurringTransaction } from '../models/RecurringTransaction';
import { Subscription } from '../models/Subscription';
import { Emi } from '../models/Emi';
import { SavingsGoal } from '../models/SavingsGoal';
import { AuthenticatedRequest } from '../middleware/auth';
import dayjs from 'dayjs';

// GET FINANCIAL HEALTH SCORE, SAFE-TO-SPEND & CASH FLOW FORECAST
export const getPlanningMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const userId = req.user.id;

    // 1. Calculate Available Account Balances
    const accounts = await Account.find({ userId, isActive: true });
    const totalAvailableBalance = accounts.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);

    // 2. Calculate Upcoming Obligations (Next 30 Days)
    const activeEmis = await Emi.find({ createdBy: userId });
    const emiMonthlyTotal = activeEmis.reduce((acc, curr) => acc + curr.monthlyEmi, 0);

    const activeSubscriptions = await Subscription.find({ userId, status: 'active' });
    const subMonthlyTotal = activeSubscriptions.reduce(
      (acc, curr) => acc + (curr.billingCycle === 'yearly' ? curr.cost / 12 : curr.cost),
      0
    );

    const recurringOutflows = await RecurringTransaction.find({ userId, type: 'EXPENSE', isActive: true });
    const recurringOutflowTotal = recurringOutflows.reduce((acc, curr) => acc + curr.amount, 0);

    const upcomingObligations = emiMonthlyTotal + subMonthlyTotal + recurringOutflowTotal;

    // 3. Savings Commitments & Emergency Fund
    const savingsGoals = await SavingsGoal.find({ createdBy: userId });
    const totalSavingsSaved = savingsGoals.reduce((acc, curr) => acc + curr.currentAmount, 0);
    const savingsCommitmentMonthly = savingsGoals.reduce((acc, curr) => acc + (curr.targetAmount / 12), 0);

    // 4. Safe-to-Spend Calculation
    const configurableReserve = 2000; // default reserve threshold
    const safeToSpend = Math.max(
      0,
      totalAvailableBalance - upcomingObligations - savingsCommitmentMonthly - configurableReserve
    );

    // 5. Emergency Fund Runway Calculator
    const essentialMonthlyExpenses = Math.max(15000, upcomingObligations);
    const emergencyRunwayMonths = Math.round((totalSavingsSaved / essentialMonthlyExpenses) * 100) / 100;
    const targetRunwayMonths = 6;

    // 6. Cash Flow Forecast (7, 30, 90 Days)
    const forecast30Days = totalAvailableBalance - upcomingObligations;
    const forecast90Days = totalAvailableBalance - upcomingObligations * 3;

    // 7. Financial Health Score (0 - 100)
    let score = 70; // baseline
    if (emergencyRunwayMonths >= 6) score += 15;
    else if (emergencyRunwayMonths >= 3) score += 10;

    if (safeToSpend > 5000) score += 10;
    if (emiMonthlyTotal < totalAvailableBalance * 0.4) score += 5;

    score = Math.min(100, Math.max(0, score));

    res.status(200).json({
      success: true,
      data: {
        totalAvailableBalance,
        safeToSpend,
        upcomingObligations,
        savingsCommitmentMonthly,
        emergencyFund: {
          currentSaved: totalSavingsSaved,
          essentialMonthlyExpenses,
          runwayMonths: emergencyRunwayMonths,
          targetRunwayMonths,
        },
        cashFlowForecast: {
          day7: Math.round(totalAvailableBalance - upcomingObligations * (7 / 30)),
          day30: Math.round(forecast30Days),
          day90: Math.round(forecast90Days),
        },
        financialHealthScore: {
          score,
          rating: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Attention',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to calculate financial planning metrics' });
  }
};
