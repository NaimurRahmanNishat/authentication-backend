"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET_KEY is not defined in environment variables.");
}
// ✅ Generate JWT Token
const generateToken = async (userId) => {
    try {
        const token = jsonwebtoken_1.default.sign({ id: userId }, // payload
        JWT_SECRET_KEY, // secret
        { expiresIn: "1h" } // expire time (1 hour)
        );
        return token;
    }
    catch (error) {
        console.error("❌ Token generation failed:", error);
        throw new Error("Token could not be generated");
    }
};
exports.default = generateToken;
