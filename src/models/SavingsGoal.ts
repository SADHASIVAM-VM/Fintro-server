import mongoose, { Schema, Document } from 'mongoose';

export interface ISavingsGoal extends Document {
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  interval: 'monthly' | 'quarterly' | 'yearly';
  createdBy: mongoose.Types.ObjectId;
}

const SavingsGoalSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    targetDate: { type: String, required: true },
    interval: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes for performance optimization
SavingsGoalSchema.index({ createdBy: 1 });

export const SavingsGoal = mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);
export default SavingsGoal;
