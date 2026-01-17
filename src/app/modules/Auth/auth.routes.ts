import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controllers";
import { AuthValidation } from "./auth.validations";

const router = express.Router();

router.post(
    "/register",
    validateRequest(AuthValidation.userRegisterSchema),
    AuthController.register,
);

router.post("/login", AuthController.loginWithEmail);

router.post("/resend-otp", AuthController.resendOTP);
router.post("/verify-otp", AuthController.verifyOTP);

router.post("/logout", AuthController.logoutUser);

router.put(
    "/change-password",
    auth(),
    validateRequest(AuthValidation.changePasswordValidationSchema),
    AuthController.changePassword,
);

router.post("/forgot-password", AuthController.forgotPassword);

router.post("/reset-password", AuthController.resetPassword);

router.post(
    "/refresh-token",
    validateRequest(AuthValidation.refreshTokenValidationSchema),
    AuthController.refreshToken,
);

// // Google Login Routes
// router.get(
// 	"/google",
// 	passport.authenticate("google", { scope: ["profile", "email"] })
// );
// router.get(
// 	"/google/callback",
// 	passport.authenticate("google", {
// 		failureRedirect: `${config.frontend_url}/login`,
// 		successRedirect: `${config.frontend_url}/`,
// 	})
// );
export const AuthRoutes = router;
