import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  action: string;
  description: string;
  user: mongoose.Types.ObjectId;
  ip?: string;
  timestamp: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    action: { type: String, required: true },
    description: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ip: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export default ActivityLog;
