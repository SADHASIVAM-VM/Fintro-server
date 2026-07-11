import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'emi_due' | 'rent_due' | 'bill_due' | 'budget_exceeded' | 'borrow_reminder' | 'savings_goal' | 'system';
  title: string;
  message: string;
  date: string; // YYYY-MM-DD
  isRead: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const NotificationSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['emi_due', 'rent_due', 'bill_due', 'budget_exceeded', 'borrow_reminder', 'savings_goal', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
