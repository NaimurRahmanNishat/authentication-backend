import mongoose, { Schema, Document, Model, Types } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  otpCode?: string;
  otpExpire?: Date;
  isVerified?: boolean;
  passwordResetToken?: string;
  passwordResetExpire?: Date;
  passwordChangedAt?: Date;
  otpRequestedAt?: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  createOtpCode(): string;
  verifyOtpCode(candidateOtp: string): boolean;
  createPasswordResetToken(): string;
  comparePasswordResetToken(candidateToken: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username must be at most 20 characters"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // hide by default
    },
    otpCode: { type: String, select: false },
    otpExpire: { type: Date, select: false },
    otpRequestedAt: { type: Date, select: false },
    isVerified: { type: Boolean, default: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpire: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.otpCode;
        delete ret.otpExpire;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpire;
        delete ret.passwordChangedAt;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.otpCode;
        delete ret.otpExpire;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpire;
        delete ret.passwordChangedAt;
        return ret;
      },
    },
  }
);

// Hash password before save when modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // @ts-ignore
  this.password = await bcrypt.hash(this.password, 12);
  // @ts-ignore
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);      // password is selected with +password in queries
};

// Create OTP (6 digits, 10 mins)
userSchema.methods.createOtpCode = function (): string {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpCode = otpCode;
  this.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
  return otpCode;
};

// Verify OTP
userSchema.methods.verifyOtpCode = function (candidateOtp: string): boolean {
  if (!this.otpCode || !this.otpExpire) return false;
  const isMatch = this.otpCode === candidateOtp;
  const isValid = this.otpExpire.getTime() > Date.now();
  return isMatch && isValid;
};

// Create password reset token (store hashed)
userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const SALT_ROUNDS = 12;
  this.passwordResetToken = bcrypt.hashSync(resetToken, SALT_ROUNDS);
  this.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken; // return raw token to send via email
};

// Compare reset token
userSchema.methods.comparePasswordResetToken = async function (candidateToken: string): Promise<boolean> {
  if (!this.passwordResetToken) return false;
  return bcrypt.compare(candidateToken, this.passwordResetToken);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
