import mongoose, { Schema, Document } from 'mongoose';

export interface IBorrowAccount extends Document {
  name: string;
  phone?: string;
  status: 'open' | 'pending' | 'closed';
  createdBy: mongoose.Types.ObjectId;
}

const BorrowAccountSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    status: {
      type: String,
      enum: ['open', 'pending', 'closed'],
      default: 'open',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const BorrowAccount = mongoose.model<IBorrowAccount>('BorrowAccount', BorrowAccountSchema);
export default BorrowAccount;
