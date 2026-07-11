import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  category: mongoose.Types.ObjectId;
  limitAmount: number;
  month: string; // YYYY-MM
  createdBy: mongoose.Types.ObjectId;
}

const BudgetSchema: Schema = new Schema(
  {
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    limitAmount: { type: Number, required: true },
    month: { type: String, required: true }, // Format YYYY-MM
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
export default Budget;
