import e, { Router } from "express";
import { userLogin, userRegister, verifyOtp } from "./user.controller";


const router = Router();

router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/verify-otp", verifyOtp);


export default router;