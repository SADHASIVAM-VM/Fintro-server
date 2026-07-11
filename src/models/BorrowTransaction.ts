import mongoose, { Schema, Document } from 'mongoose';

export interface IBorrowTransaction extends Document {
  account: mongoose.Types.ObjectId;
  type: 'borrowed' | 'lent' | 'paid_borrow' | 'paid_lent';
  amount: number;
  date: string; // YYYY-MM-DD
  receiptImage?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  parentTransaction?: mongoose.Types.ObjectId;
}

const BorrowTransactionSchema: Schema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'BorrowAccount', required: true },
    type: {
      type: String,
      enum: ['borrowed', 'lent', 'paid_borrow', 'paid_lent'],
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    receiptImage: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentTransaction: { type: Schema.Types.ObjectId, ref: 'BorrowTransaction' },
  },
  { timestamps: true }
);

export const BorrowTransaction = mongoose.model<IBorrowTransaction>('BorrowTransaction', BorrowTransactionSchema);
export default BorrowTransaction;
