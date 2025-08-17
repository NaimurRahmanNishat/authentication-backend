"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.userLogin = exports.userRegister = void 0;
const ResponseHandler_1 = require("../utils/ResponseHandler");
const user_model_1 = __importDefault(require("./user.model"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const generateToken_1 = __importDefault(require("../middleware/generateToken"));
// ✅ Register Controller
const userRegister = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (username.length < 3 || username.length > 20) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Username must be between 3 to 20 characters");
        }
        if (!email.includes("@")) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Invalid email format");
        }
        if (password.length < 6) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Password must be at least 6 characters");
        }
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "User already exists");
        }
        const newUser = new user_model_1.default({ username, email, password });
        await newUser.save();
        (0, ResponseHandler_1.successResponse)(res, 201, "User registered successfully", { id: newUser._id, username: newUser.username, email: newUser.email });
    }
    catch (error) {
        (0, ResponseHandler_1.errorResponse)(res, 500, "Internal Server Error");
    }
};
exports.userRegister = userRegister;
// ✅ Login Controller (Step 1: check password, send OTP)
const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Email is required");
        }
        if (!password) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Password is required");
        }
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            return (0, ResponseHandler_1.errorResponse)(res, 404, "User not found");
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return (0, ResponseHandler_1.errorResponse)(res, 401, "Invalid password");
        }
        // Send OTP
        const otpCode = user.createOtpCode();
        await user.save();
        // send OTP via email
        await (0, sendEmail_1.default)(user.email, "Your OTP Code", `Your OTP code is: ${otpCode}`);
        return (0, ResponseHandler_1.successResponse)(res, 200, "OTP sent to email. Please verify.", { email: user.email });
    }
    catch (error) {
        console.error("❌ Login error:", error);
        return (0, ResponseHandler_1.errorResponse)(res, 500, error.message || "Something went wrong");
    }
};
exports.userLogin = userLogin;
// ✅ Verify OTP Controller (Step 2: verify OTP)
const verifyOtp = async (req, res) => {
    try {
        const { email, otpCode } = req.body;
        if (!email || !otpCode) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Email and OTP are required");
        }
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            return (0, ResponseHandler_1.errorResponse)(res, 404, "User not found");
        }
        const isValidOtp = user.verifyOtpCode(otpCode);
        if (!isValidOtp) {
            return (0, ResponseHandler_1.errorResponse)(res, 400, "Invalid or expired OTP");
        }
        // JWT token generate
        const token = await (0, generateToken_1.default)(user._id.toString());
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        return (0, ResponseHandler_1.successResponse)(res, 200, "Login successful", {
            token,
            id: user._id,
            username: user.username,
            email: user.email,
        });
    }
    catch (error) {
        return (0, ResponseHandler_1.errorResponse)(res, 500, error.message);
    }
};
exports.verifyOtp = verifyOtp;
