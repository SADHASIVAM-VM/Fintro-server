import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialRule extends Document {
  userId: mongoose.Types.ObjectId;
  merchantPattern: string; // e.g. "Swiggy", "Uber", "Netflix"
  targetCategoryId?: mongoose.Types.ObjectId;
  targetPaymentMethod?: string;
  flagReviewThreshold?: number;
  isActive: boolean;
}

const FinancialRuleSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    merchantPattern: { type: String, required: true },
    targetCategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    targetPaymentMethod: { type: String },
    flagReviewThreshold: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FinancialRuleSchema.index({ userId: 1 });

export const FinancialRule = mongoose.model<IFinancialRule>('FinancialRule', FinancialRuleSchema);
export default FinancialRule;
