"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.verifyOtp = exports.userLogin = exports.userRegister = void 0;
const user_model_1 = __importDefault(require("./user.model"));
const ResponseHandler_1 = require("../utils/ResponseHandler");
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const generateToken_1 = __importDefault(require("../middleware/generateToken"));
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
// Register
const userRegister = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Username, email and password are required");
        }
        if (username.length < 3 || username.length > 20) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Username must be between 3 to 20 characters");
        }
        if (!isEmail(email)) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Invalid email format");
        }
        if (password.length < 6) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Password must be at least 6 characters");
        }
        try {
            const newUser = await user_model_1.default.create({ username, email, password });
            return (0, ResponseHandler_1.successResponse)(res, 201, "User registered successfully", {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            });
        }
        catch (e) {
            // duplicate key
            if (e?.code === 11000) {
                const field = Object.keys(e.keyPattern || {})[0] || "field";
                return (0, ResponseHandler_1.errorResponse)(res, 400, `User with this ${field} already exists`);
            }
            throw e;
        }
    }
    catch (error) {
        return (0, ResponseHandler_1.errorResponse)(res, 500, "Internal Server Error", error);
    }
};
exports.userRegister = userRegister;
// Login (Step 1: check password, send OTP)
const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email)
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Email is required");
        if (!password)
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Password is required");
        const user = await user_model_1.default.findOne({ email: email.toLowerCase().trim() }).select("+password +otpCode +otpExpire");
        if (!user)
            return (0, ResponseHandler_1.errorResponse)(res, 404, "User not found");
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid)
            return (0, ResponseHandler_1.errorResponse)(res, 401, "Invalid password");
        // Generate & save OTP
        const otpCode = user.createOtpCode();
        await user.save({ validateBeforeSave: false });
        // Send OTP via email
        await (0, sendEmail_1.default)(user.email, "Your OTP Code", `Your OTP code is: ${otpCode}`);
        return (0, ResponseHandler_1.successResponse)(res, 200, "OTP sent to email. Please verify.", {
            email: user.email,
        });
    }
    catch (error) {
        return (0, ResponseHandler_1.errorResponse)(res, 500, error?.message || "Something went wrong", error);
    }
};
exports.userLogin = userLogin;
// Verify OTP (Step 2)
const verifyOtp = async (req, res) => {
    try {
        const { email, otpCode } = req.body;
        if (!email || !otpCode) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Email and OTP are required");
        }
        const user = await user_model_1.default.findOne({ email: email.toLowerCase().trim() }).select("+otpCode +otpExpire");
        if (!user)
            return (0, ResponseHandler_1.errorResponse)(res, 404, "User not found");
        const isValidOtp = user.verifyOtpCode(otpCode);
        if (!isValidOtp)
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Invalid or expired OTP");
        // Clear OTP after successful verification
        user.otpCode = undefined;
        user.otpExpire = undefined;
        await user.save({ validateBeforeSave: false });
        // JWT
        const token = await (0, generateToken_1.default)(user._id.toString());
        const isProd = process.env.NODE_ENV === "production";
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProd, // only secure in prod
            sameSite: isProd ? "none" : "lax",
            maxAge: 60 * 60 * 1000, // 1 hour
        });
        return (0, ResponseHandler_1.successResponse)(res, 200, "Login successful", {
            token,
            id: user._id,
            username: user.username,
            email: user.email,
        });
    }
    catch (error) {
        return (0, ResponseHandler_1.errorResponse)(res, 500, error?.message || "Something went wrong", error);
    }
};
exports.verifyOtp = verifyOtp;
// Forgot password (send OTP)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Email is required");
        const user = await user_model_1.default.findOne({ email: email.toLowerCase().trim() }).select("+otpCode +otpExpire");
        if (!user)
            return (0, ResponseHandler_1.errorResponse)(res, 404, "User not found");
        const otp = user.createOtpCode();
        await user.save({ validateBeforeSave: false });
        const message = `Hello ${user.username}, Your OTP for password reset is ${otp}. This OTP will expire in 10 minutes. Regards, Cineflix`;
        await (0, sendEmail_1.default)(user.email, "Password Reset OTP", message);
        return (0, ResponseHandler_1.successResponse)(res, 200, "OTP sent to your email successfully!");
    }
    catch (error) {
        return (0, ResponseHandler_1.errorResponse)(res, 500, "Failed to send OTP!", error);
    }
};
exports.forgotPassword = forgotPassword;
// Reset password (with OTP)
const resetPassword = async (req, res) => {
    try {
        const { email, otpCode, newPassword } = req.body;
        if (!email || !otpCode || !newPassword) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Email, OTP and New Password are required!");
        }
        if (newPassword.length < 6) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "New password must be at least 6 characters");
        }
        const user = await user_model_1.default.findOne({ email: email.toLowerCase().trim() }).select("+otpCode +otpExpire +password");
        if (!user)
            return (0, ResponseHandler_1.errorResponse)(res, 404, "User not found!");
        const isValidOtp = user.verifyOtpCode(otpCode);
        if (!isValidOtp)
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Invalid or expired OTP!");
        // Set new password; pre('save') will hash & update passwordChangedAt
        user.password = newPassword;
        // Clear OTP after use
        user.otpCode = undefined;
        user.otpExpire = undefined;
        await user.save();
        return (0, ResponseHandler_1.successResponse)(res, 200, "Password reset successful!");
    }
    catch (error) {
        return (0, ResponseHandler_1.errorResponse)(res, 500, "Failed to reset password!", error);
    }
};
exports.resetPassword = resetPassword;
