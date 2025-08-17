import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/ResponseHandler";
import User from "./user.model";
import sendEmail from "../utils/sendEmail";
import generateToken from "../middleware/generateToken";

// ✅ Register Controller
const userRegister = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        if( username.length < 3 || username.length > 20) {
            return errorResponse(res, 400, "Username must be between 3 to 20 characters");
        }
        if( !email.includes("@")) {
            return errorResponse(res, 400, "Invalid email format");
        }
        if(password.length < 6) {
            return errorResponse(res, 400, "Password must be at least 6 characters");
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse(res, 400, "User already exists");
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        successResponse(res, 201, "User registered successfully", { id: newUser._id, username: newUser.username, email: newUser.email });
    } catch (error: any) {
        errorResponse(res, 500, "Internal Server Error");
    }
}

// ✅ Login Controller (Step 1: check password, send OTP)
const userLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if(!email){
            return errorResponse(res, 400, "Email is required");
        }
        if (!password) {
            return errorResponse(res, 400, "Password is required");
        }
        const user = await User.findOne({ email });
        if (!user) {
            return errorResponse(res, 404, "User not found");
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return errorResponse(res, 401, "Invalid password");
        }
        // Send OTP
        const otpCode = user.createOtpCode();
        await user.save();
        // send OTP via email
        await sendEmail(user.email, "Your OTP Code", `Your OTP code is: ${otpCode}`);
        return successResponse(res, 200, "OTP sent to email. Please verify.", { email: user.email });
    } catch (error: any) {
        console.error("❌ Login error:", error); 
        return errorResponse(res, 500, error.message || "Something went wrong");
    }
}


// ✅ Verify OTP Controller (Step 2: verify OTP)
const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otpCode } = req.body;
        if (!email || !otpCode) {
            return errorResponse(res, 400, "Email and OTP are required");
        }
        const user = await User.findOne({ email });
        if (!user) {
            return errorResponse(res, 404, "User not found");
        }
        const isValidOtp = user.verifyOtpCode(otpCode);
        if (!isValidOtp) {
            return errorResponse(res, 400, "Invalid or expired OTP");
        }
        // JWT token generate
        const token = await generateToken(user._id.toString());
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        return successResponse(res, 200, "Login successful", {
            token,
            id: user._id,
            username: user.username,
            email: user.email,
        });
    } catch (error: any) {
        return errorResponse(res, 500, error.message);
    }
};


export { userRegister, userLogin, verifyOtp }