import mongoose, { Schema, Document } from 'mongoose';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface IRecurringTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  nextOccurrence: string; // YYYY-MM-DD
  accountId: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  isActive: boolean;
}

const RecurringTransactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['EXPENSE', 'INCOME'], required: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    startDate: { type: String, required: true },
    endDate: { type: String },
    nextOccurrence: { type: String, required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RecurringTransactionSchema.index({ userId: 1, nextOccurrence: 1 });

export const RecurringTransaction = mongoose.model<IRecurringTransaction>(
  'RecurringTransaction',
  RecurringTransactionSchema
);
export default RecurringTransaction;
