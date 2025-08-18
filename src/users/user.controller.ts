import { Request, Response } from "express";
import User from "./user.model";
import { errorResponse, successResponse } from "../utils/ResponseHandler";
import sendEmail from "../utils/sendEmail";
import generateToken from "../middleware/generateToken";
import { Types } from "mongoose";
const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);

// Register
const userRegister = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      return errorResponse(res, 400, "Username, email and password are required");
    }
    if (username.length < 3 || username.length > 20) {
      return errorResponse(res, 400, "Username must be between 3 to 20 characters");
    }
    if (!isEmail(email)) {
      return errorResponse(res, 400, "Invalid email format");
    }
    if (password.length < 6) {
      return errorResponse(res, 400, "Password must be at least 6 characters");
    }

    try {
      const newUser = await User.create({ username, email, password });
      return successResponse(res, 201, "User registered successfully", {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      });
    } catch (e: any) {
      // duplicate key
      if (e?.code === 11000) {
        const field = Object.keys(e.keyPattern || {})[0] || "field";
        return errorResponse(res, 400, `User with this ${field} already exists`);
      }
      throw e;
    }
  } catch (error: any) {
    return errorResponse(res, 500, "Internal Server Error", error);
  }
};

// Login (Step 1: check password, send OTP)
const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email) return errorResponse(res, 400, "Email is required");
    if (!password) return errorResponse(res, 400, "Password is required");

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+password +otpCode +otpExpire"
    );
    if (!user) return errorResponse(res, 404, "User not found");

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return errorResponse(res, 401, "Invalid password");

    // Generate & save OTP
    const otpCode = user.createOtpCode();
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    await sendEmail(user.email, "Your OTP Code", `Your OTP code is: ${otpCode}`);

    return successResponse(res, 200, "OTP sent to email. Please verify.", {
      email: user.email,
    });
  } catch (error: any) {
    return errorResponse(res, 500, error?.message || "Something went wrong", error);
  }
};

// Verify OTP (Step 2)
const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otpCode } = req.body as { email?: string; otpCode?: string };
    if (!email || !otpCode) {
      return errorResponse(res, 400, "Email and OTP are required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+otpCode +otpExpire"
    );
    if (!user) return errorResponse(res, 404, "User not found");

    const isValidOtp = user.verifyOtpCode(otpCode);
    if (!isValidOtp) return errorResponse(res, 400, "Invalid or expired OTP");

    // Clear OTP after successful verification
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // JWT
    const token = await generateToken((user._id as Types.ObjectId).toString());

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd, // only secure in prod
      sameSite: isProd ? "none" : "lax",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return successResponse(res, 200, "Login successful", {
      token,
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error: any) {
    return errorResponse(res, 500, error?.message || "Something went wrong", error);
  }
};

// Forgot password (send OTP)
const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return errorResponse(res, 400, "Email is required");

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+otpCode +otpExpire"
    );
    if (!user) return errorResponse(res, 404, "User not found");

    const otp = user.createOtpCode();
    await user.save({ validateBeforeSave: false });

    const message = `Hello ${user.username}, Your OTP for password reset is ${otp}. This OTP will expire in 10 minutes. Regards, Cineflix`;
    await sendEmail(user.email, "Password Reset OTP", message);

    return successResponse(res, 200, "OTP sent to your email successfully!");
  } catch (error: any) {
    return errorResponse(res, 500, "Failed to send OTP!", error);
  }
};

// Reset password (with OTP)
const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otpCode, newPassword } = req.body as {
      email?: string;
      otpCode?: string;
      newPassword?: string;
    };

    if (!email || !otpCode || !newPassword) {
      return errorResponse(res, 400, "Email, OTP and New Password are required!");
    }
    if (newPassword.length < 6) {
      return errorResponse(res, 400, "New password must be at least 6 characters");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+otpCode +otpExpire +password"
    );
    if (!user) return errorResponse(res, 404, "User not found!");

    const isValidOtp = user.verifyOtpCode(otpCode);
    if (!isValidOtp) return errorResponse(res, 400, "Invalid or expired OTP!");

    // Set new password; pre('save') will hash & update passwordChangedAt
    user.password = newPassword;

    // Clear OTP after use
    user.otpCode = undefined;
    user.otpExpire = undefined;

    await user.save();

    return successResponse(res, 200, "Password reset successful!");
  } catch (error: any) {
    return errorResponse(res, 500, "Failed to reset password!", error);
  }
};

const userLogout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax", 
      secure: process.env.NODE_ENV === "production", 
    });
    successResponse(res, 200, "Logout successful!");
  } catch (error) {
    console.error("Logout error:", error);
    errorResponse(res, 500, "Logout failed!");
  }
}

export { userRegister, userLogin, verifyOtp, forgotPassword, resetPassword, userLogout };