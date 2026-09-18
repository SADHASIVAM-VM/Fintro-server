import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  cost: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string; // YYYY-MM-DD
  accountId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  status: 'active' | 'paused' | 'cancelled';
  priceHistory: Array<{
    amount: number;
    changedAt: string;
  }>;
}

const SubscriptionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    cost: { type: Number, required: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    nextBillingDate: { type: String, required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
    priceHistory: [
      {
        amount: { type: Number },
        changedAt: { type: String },
      },
    ],
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, nextBillingDate: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;
