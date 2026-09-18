import mongoose, { Schema, Document } from 'mongoose';

export type AccountType =
  | 'bank_account'
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'upi_wallet'
  | 'e_wallet'
  | 'other';

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: AccountType;
  institution?: string;
  accountIdentifier?: string;
  openingBalance: number;
  currentBalance: number;
  currency: string;
  isActive: boolean;
}

const AccountSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['bank_account', 'cash', 'credit_card', 'debit_card', 'upi_wallet', 'e_wallet', 'other'],
      required: true,
    },
    institution: { type: String, default: '' },
    accountIdentifier: { type: String, default: '' },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AccountSchema.index({ userId: 1 });

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
export default Account;
