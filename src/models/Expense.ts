import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  title: string;
  amount: number;
  category: mongoose.Types.ObjectId;
  paymentMode: 'cash' | 'upi' | 'credit_card' | 'debit_card' | 'net_banking';
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  notes?: string;
  receiptImage?: string;
  tags?: string[];
  createdBy: mongoose.Types.ObjectId;
}

const ExpenseSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'credit_card', 'debit_card', 'net_banking'],
      required: true,
    },
    date: { type: String, required: true },
    time: { type: String },
    notes: { type: String },
    receiptImage: { type: String },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
export default Expense;
