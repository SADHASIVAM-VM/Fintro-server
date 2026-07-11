import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  avatar: string;
  comparePassword: (enteredPassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

// Password hashing hook (Promise-based)
UserSchema.pre('save', async function (this: any) {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password verification helper method
UserSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  const user = this as any;
  return bcrypt.compare(enteredPassword, user.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
