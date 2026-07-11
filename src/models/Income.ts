import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  source: 'salary' | 'freelance' | 'bonus' | 'refund' | 'interest' | 'gift';
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const IncomeSchema: Schema = new Schema(
  {
    source: {
      type: String,
      enum: ['salary', 'freelance', 'bonus', 'refund', 'interest', 'gift'],
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Income = mongoose.model<IIncome>('Income', IncomeSchema);
export default Income;
