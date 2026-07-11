import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomPurchase extends Document {
  name: string;
  price: number;
  quantity: number;
  shop?: string;
  date: string; // YYYY-MM-DD
  warrantyMonths?: number;
  billImage?: string;
  category: 'kitchen' | 'masalas' | 'cleaning' | 'furniture' | 'gas' | 'other';
  createdBy: mongoose.Types.ObjectId;
}

const RoomPurchaseSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    shop: { type: String },
    date: { type: String, required: true },
    warrantyMonths: { type: Number, default: 0 },
    billImage: { type: String },
    category: {
      type: String,
      enum: ['kitchen', 'masalas', 'cleaning', 'furniture', 'gas', 'other'],
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const RoomPurchase = mongoose.model<IRoomPurchase>('RoomPurchase', RoomPurchaseSchema);
export default RoomPurchase;
