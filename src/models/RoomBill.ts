import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomBill extends Document {
  month: string; // YYYY-MM
  type: 'electricity' | 'water' | 'internet';
  amount: number;
  units?: number; // primarily for electricity bills
  isPaid: boolean;
  dueDate: string; // YYYY-MM-DD
  createdBy: mongoose.Types.ObjectId;
}

const RoomBillSchema: Schema = new Schema(
  {
    month: { type: String, required: true }, // Format YYYY-MM
    type: {
      type: String,
      enum: ['electricity', 'water', 'internet'],
      required: true,
    },
    amount: { type: Number, required: true },
    units: { type: Number },
    isPaid: { type: Boolean, default: false },
    dueDate: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const RoomBill = mongoose.model<IRoomBill>('RoomBill', RoomBillSchema);
export default RoomBill;
