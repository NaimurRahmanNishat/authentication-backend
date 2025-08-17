"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const generateToken = (userId) => {
    if (!JWT_SECRET_KEY) {
        throw new Error("JWT_SECRET not defined");
    }
    return jsonwebtoken_1.default.sign({ id: userId }, // payload (object / string)
    JWT_SECRET_KEY, // secret (must NOT be null)
    { expiresIn: "1d" } // options (expiresIn allowed here)
    );
};
exports.default = generateToken;
