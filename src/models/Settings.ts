import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  currency: string; // e.g. 'INR', 'USD'
  timezone: string; // e.g. 'Asia/Kolkata', 'UTC'
  language: string; // e.g. 'en', 'es'
  budgetLimits?: number; // global limits
  notificationFlags?: {
    emiReminders: boolean;
    billReminders: boolean;
    budgetAlerts: boolean;
  };
  user: mongoose.Types.ObjectId;
}

const SettingsSchema: Schema = new Schema(
  {
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'en' },
    budgetLimits: { type: Number },
    notificationFlags: {
      emiReminders: { type: Boolean, default: true },
      billReminders: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true },
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
export default Settings;
