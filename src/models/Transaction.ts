import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType =
  | 'EXPENSE'
  | 'INCOME'
  | 'TRANSFER'
  | 'BORROW'
  | 'LEND'
  | 'REPAYMENT'
  | 'REFUND'
  | 'EMI_PAYMENT';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  accountId: mongoose.Types.ObjectId;
  destinationAccountId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  personId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  loanId?: mongoose.Types.ObjectId;
  description: string;
  merchant?: string;
  date: string; // YYYY-MM-DD
  paymentMethod?: string;
  receiptId?: mongoose.Types.ObjectId;
  notes?: string;
  tags?: string[];
  status: 'PENDING' | 'CONFIRMED' | 'ARCHIVED';
}

const TransactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['EXPENSE', 'INCOME', 'TRANSFER', 'BORROW', 'LEND', 'REPAYMENT', 'REFUND', 'EMI_PAYMENT'],
      required: true,
    },
    amount: { type: Number, required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    destinationAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    personId: { type: Schema.Types.ObjectId, ref: 'BorrowAccount' },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    loanId: { type: Schema.Types.ObjectId, ref: 'Emi' },
    description: { type: String, required: true },
    merchant: { type: String },
    date: { type: String, required: true },
    paymentMethod: { type: String },
    receiptId: { type: Schema.Types.ObjectId, ref: 'Receipt' },
    notes: { type: String },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'ARCHIVED'],
      default: 'CONFIRMED',
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ accountId: 1 });
TransactionSchema.index({ type: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;
