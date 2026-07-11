import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomInventory extends Document {
  item: 'fan' | 'chair' | 'table' | 'mattress' | 'induction' | 'gas_stove' | 'other';
  customName?: string;
  status: 'working' | 'repair' | 'disposed';
  quantity: number;
  lastChecked?: string; // YYYY-MM-DD
  createdBy: mongoose.Types.ObjectId;
}

const RoomInventorySchema: Schema = new Schema(
  {
    item: {
      type: String,
      enum: ['fan', 'chair', 'table', 'mattress', 'induction', 'gas_stove', 'other'],
      required: true,
    },
    customName: { type: String },
    status: {
      type: String,
      enum: ['working', 'repair', 'disposed'],
      default: 'working',
    },
    quantity: { type: Number, required: true, default: 1 },
    lastChecked: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const RoomInventory = mongoose.model<IRoomInventory>('RoomInventory', RoomInventorySchema);
export default RoomInventory;
