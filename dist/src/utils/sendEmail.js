"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = async (to, subject, text) => {
    try {
        // ✅ create Transport 
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587, // 587 or 465
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        // ✅ Mail options
        const mailOptions = {
            from: `"Your App" <${process.env.SMTP_USER}>`, to, subject, text
        };
        // ✅ Send mail
        await transporter.sendMail(mailOptions);
        console.log("📧 Sending email to:", to, "with subject:", subject);
        ;
    }
    catch (error) {
        console.error("❌ Email sending failed:", error);
        throw new Error("Email could not be sent");
    }
};
exports.default = sendEmail;
