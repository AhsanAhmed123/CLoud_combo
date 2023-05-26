import bcrypt from 'bcryptjs';
import { model, Schema } from 'mongoose';
import validator from 'validator';

export interface IUser {
  email: string;
  password?: string;
  platform: string;
  createdAt: Date;
  updatedAt: Date;
  correctPassword: (candidatePassword: string, currentPassword: string) => Promise<boolean>;
  isLtdUser: () => boolean;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    isLtdUser: {
        type: Boolean,
    },
    platform: {
        type: String,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.methods.correctPassword = async function (candidatePassword: string, userPassword: string) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export const User = model<IUser>('User', userSchema);
