import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomRent extends Document {
  month: string; // YYYY-MM
  rentAmount: number;
  isPaid: boolean;
  dueDate: string; // YYYY-MM-DD
  paidDate?: string; // YYYY-MM-DD
  createdBy: mongoose.Types.ObjectId;
}

const RoomRentSchema: Schema = new Schema(
  {
    month: { type: String, required: true }, // Format YYYY-MM
    rentAmount: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    dueDate: { type: String, required: true },
    paidDate: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes for performance optimization
RoomRentSchema.index({ createdBy: 1 });
RoomRentSchema.index({ month: 1 });

export const RoomRent = mongoose.model<IRoomRent>('RoomRent', RoomRentSchema);
export default RoomRent;
