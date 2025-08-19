import { Router } from "express";
import { forgotPassword, resetPassword, userLogin, userLogout, userRegister, verifyOtp, verifyRegisterOtp } from "./user.controller";

const router = Router();

router.post("/register", userRegister);
router.post("/verify-register-otp", verifyRegisterOtp);
router.post("/login", userLogin);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", userLogout);

export default router;
