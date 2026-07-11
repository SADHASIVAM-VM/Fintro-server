import mongoose, { Schema, Document } from 'mongoose';

export interface IEmi extends Document {
  loanName: string;
  principal: number;
  interestRate: number; // percentage
  monthlyEmi: number;
  monthsTotal: number;
  monthsPaid: number;
  remainingBalance: number;
  dueDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  createdBy: mongoose.Types.ObjectId;
}

const EmiSchema: Schema = new Schema(
  {
    loanName: { type: String, required: true },
    principal: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    monthlyEmi: { type: Number, required: true },
    monthsTotal: { type: Number, required: true },
    monthsPaid: { type: Number, default: 0 },
    remainingBalance: { type: Number, required: true },
    dueDate: { type: String, required: true },
    startDate: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes for performance optimization
EmiSchema.index({ createdBy: 1 });

export const Emi = mongoose.model<IEmi>('Emi', EmiSchema);
export default Emi;
