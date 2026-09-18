import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomMember {
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface IRoom extends Document {
  name: string;
  inviteCode: string;
  currency: string;
  createdBy: mongoose.Types.ObjectId;
  members: IRoomMember[];
  isActive: boolean;
}

const RoomMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RoomSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    inviteCode: { type: String, required: true, unique: true, index: true },
    currency: { type: String, default: 'INR' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [RoomMemberSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RoomSchema.index({ createdBy: 1 });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
export default Room;
