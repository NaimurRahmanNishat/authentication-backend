"use strict";
// import mongoose, { Schema, Document } from "mongoose";
// import bcrypt from "bcrypt";
// import crypto from "crypto";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// export interface IUser extends Document {
//   username: string;
//   email: string;
//   password: string;
//   otpCode?: string;
//   otpExpire?: Date;
//   passwordResetToken?: string;
//   passwordResetExpire?: Date;
//   passwordChangedAt?: Date;
//   comparePassword(candidatePassword: string): Promise<boolean>;
//   createOtpCode(): string;
//   verifyOtpCode(candidateOtp: string): boolean;
//   createPasswordResetToken(): string;
//   comparePasswordResetToken(candidateToken: string): Promise<boolean>;
// }
// const userSchema = new Schema<IUser>(
//   {
//     username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, required: true, minlength: 6 },
//     otpCode: { type: String },
//     otpExpire: { type: Date },
//     passwordResetToken: { type: String },
//     passwordResetExpire: { type: Date },
//     passwordChangedAt: { type: Date },
//   },
//   { timestamps: true }
// );
// // ✅ Hash password before save
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   // when password changed then passwordChangedAt update
//   this.passwordChangedAt = new Date(Date.now() - 1000);
//   next();
// });
// // ✅ Compare password
// userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
//   return await bcrypt.compare(candidatePassword, this.password);
// };
// // ✅ Create OTP
// userSchema.methods.createOtpCode = function (): string {
//   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//   this.otpCode = otpCode;
//   this.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
//   return otpCode;
// };
// // ✅ Verify OTP
// userSchema.methods.verifyOtpCode = function (candidateOtp: string): boolean {
//   if (!this.otpCode || !this.otpExpire) return false;
//   const isMatch = this.otpCode === candidateOtp;
//   const isValid = this.otpExpire > new Date();
//   return isMatch && isValid;
// };
// // ✅ Create password reset token (hashed)
// userSchema.methods.createPasswordResetToken = function (): string {
//   const resetToken = crypto.randomBytes(32).toString("hex");
//   this.passwordResetToken = bcrypt.hashSync(resetToken, 12);
//   this.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
//   return resetToken; // raw token return
// };
// // ✅ Compare password reset token
// userSchema.methods.comparePasswordResetToken = async function (candidateToken: string): Promise<boolean> {
//   if (!this.passwordResetToken) return false;
//   return await bcrypt.compare(candidateToken, this.passwordResetToken);
// };
// const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
// export default User;
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const userSchema = new mongoose_1.Schema({
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
    passwordResetToken: { type: String, select: false },
    passwordResetExpire: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
}, {
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
});
// Unique indexes (helps ensure at DB level too)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
// Hash password before save when modified
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    const SALT_ROUNDS = 12;
    // @ts-ignore
    this.password = await bcrypt_1.default.hash(this.password, SALT_ROUNDS);
    // Set passwordChangedAt just before issuing token
    // Subtract 1s to avoid token issued before this timestamp
    // @ts-ignore
    this.passwordChangedAt = new Date(Date.now() - 1000);
    next();
});
// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    // password is selected with +password in queries
    return bcrypt_1.default.compare(candidatePassword, this.password);
};
// Create OTP (6 digits, 10 mins)
userSchema.methods.createOtpCode = function () {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpCode = otpCode;
    this.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    return otpCode;
};
// Verify OTP
userSchema.methods.verifyOtpCode = function (candidateOtp) {
    if (!this.otpCode || !this.otpExpire)
        return false;
    const isMatch = this.otpCode === candidateOtp;
    const isValid = this.otpExpire.getTime() > Date.now();
    return isMatch && isValid;
};
// Create password reset token (store hashed)
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    const SALT_ROUNDS = 12;
    this.passwordResetToken = bcrypt_1.default.hashSync(resetToken, SALT_ROUNDS);
    this.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken; // return raw token to send via email
};
// Compare reset token
userSchema.methods.comparePasswordResetToken = async function (candidateToken) {
    if (!this.passwordResetToken)
        return false;
    return bcrypt_1.default.compare(candidateToken, this.passwordResetToken);
};
const User = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = User;
