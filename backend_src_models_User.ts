import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role: 'Admin' | 'Member';
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password: string) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', userSchema);