import { Response } from 'express';
import { Subscription } from '../models/Subscription';
import { AuthenticatedRequest } from '../middleware/auth';

export const getSubscriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const list = await Subscription.find({ userId: req.user.id })
      .populate('accountId', 'name type')
      .populate('categoryId', 'name color icon')
      .sort({ nextBillingDate: 1 });

    const totalMonthlyCost = list
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + (s.billingCycle === 'yearly' ? s.cost / 12 : s.cost), 0);

    const totalAnnualCost = totalMonthlyCost * 12;

    res.status(200).json({
      success: true,
      data: list,
      meta: {
        totalMonthlyCost,
        totalAnnualCost,
        activeSubscriptionsCount: list.filter((s) => s.status === 'active').length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch subscriptions' });
  }
};

export const createSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { name, cost, billingCycle, nextBillingDate, accountId, categoryId } = req.body;

    if (!name || !cost || !nextBillingDate) {
      res.status(400).json({ message: 'Subscription name, cost, and next billing date are required' });
      return;
    }

    const costNum = Number(cost);

    const item = await Subscription.create({
      userId: req.user.id,
      name,
      cost: costNum,
      billingCycle: billingCycle || 'monthly',
      nextBillingDate,
      accountId: accountId || undefined,
      categoryId: categoryId || undefined,
      status: 'active',
      priceHistory: [{ amount: costNum, changedAt: new Date().toISOString() }],
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created',
      data: item,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create subscription' });
  }
};

export const updateSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { id } = req.params;
    const { cost, status, nextBillingDate } = req.body;

    const item = await Subscription.findOne({ _id: id, userId: req.user.id });
    if (!item) {
      res.status(404).json({ message: 'Subscription not found' });
      return;
    }

    if (cost !== undefined && Number(cost) !== item.cost) {
      item.priceHistory.push({
        amount: Number(cost),
        changedAt: new Date().toISOString(),
      });
      item.cost = Number(cost);
    }

    if (status) item.status = status;
    if (nextBillingDate) item.nextBillingDate = nextBillingDate;

    await item.save();

    res.status(200).json({
      success: true,
      message: 'Subscription updated',
      data: item,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update subscription' });
  }
};

export const deleteSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { id } = req.params;
    await Subscription.deleteOne({ _id: id, userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Subscription deleted',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete subscription' });
  }
};
