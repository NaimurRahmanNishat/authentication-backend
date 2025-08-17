import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  otpCode?: string;
  otpExpire?: Date;
  passwordResetToken?: string;
  passwordResetExpire?: Date;
  passwordChangedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createOtpCode(): string;
  verifyOtpCode(candidateOtp: string): boolean;
  createPasswordResetToken(): string;
  comparePasswordResetToken(candidateToken: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    otpCode: { type: String },
    otpExpire: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpire: { type: Date },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

// ✅ Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // when password changed then passwordChangedAt update
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ✅ Compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ✅ Create OTP
userSchema.methods.createOtpCode = function (): string {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpCode = otpCode;
  this.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  return otpCode;
};

// ✅ Verify OTP
userSchema.methods.verifyOtpCode = function (candidateOtp: string): boolean {
  if (!this.otpCode || !this.otpExpire) return false;
  const isMatch = this.otpCode === candidateOtp;
  const isValid = this.otpExpire > new Date();
  return isMatch && isValid;
};

// ✅ Create password reset token (hashed)
userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = bcrypt.hashSync(resetToken, 12);
  this.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  return resetToken; // raw token return
};

// ✅ Compare password reset token
userSchema.methods.comparePasswordResetToken = async function (candidateToken: string): Promise<boolean> {
  if (!this.passwordResetToken) return false;
  return await bcrypt.compare(candidateToken, this.passwordResetToken);
};

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
