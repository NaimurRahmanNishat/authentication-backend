"use strict";
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
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const userSchema = new mongoose_1.Schema({
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    otpCode: { type: String },
    otpExpire: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpire: { type: Date },
    passwordChangedAt: { type: Date },
}, { timestamps: true });
// ✅ Hash password before save
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await bcrypt_1.default.hash(this.password, 12);
    // when password changed then passwordChangedAt update
    this.passwordChangedAt = new Date(Date.now() - 1000);
    next();
});
// ✅ Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt_1.default.compare(candidatePassword, this.password);
};
// ✅ Create OTP
userSchema.methods.createOtpCode = function () {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpCode = otpCode;
    this.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    return otpCode;
};
// ✅ Verify OTP
userSchema.methods.verifyOtpCode = function (candidateOtp) {
    if (!this.otpCode || !this.otpExpire)
        return false;
    const isMatch = this.otpCode === candidateOtp;
    const isValid = this.otpExpire > new Date();
    return isMatch && isValid;
};
// ✅ Create password reset token (hashed)
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    this.passwordResetToken = bcrypt_1.default.hashSync(resetToken, 12);
    this.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    return resetToken; // raw token return
};
// ✅ Compare password reset token
userSchema.methods.comparePasswordResetToken = async function (candidateToken) {
    if (!this.passwordResetToken)
        return false;
    return await bcrypt_1.default.compare(candidateToken, this.passwordResetToken);
};
const User = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = User;
