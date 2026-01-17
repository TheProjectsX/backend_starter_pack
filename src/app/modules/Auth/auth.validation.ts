import { z } from "zod";

const userRegisterSchema = z.object({
    name: z.string(),
    phone: z.string(),
    email: z.email(),
    password: z.string(),
});
export type UserRegisterInput = z.infer<typeof userRegisterSchema>;

const changePasswordValidationSchema = z.object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6),
});
export type ChangePasswordInput = z.infer<
    typeof changePasswordValidationSchema
>;

const forgetPasswordValidationSchema = z.object({
    email: z.email(),
});
export type ForgetPasswordInput = z.infer<
    typeof forgetPasswordValidationSchema
>;

const resetPasswordValidationSchema = z.object({
    token: z.string(),
    password: z.string().min(6),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordValidationSchema>;

const refreshTokenValidationSchema = z.object({
    refreshToken: z.string(),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenValidationSchema>;

export const AuthValidation = {
    userRegisterSchema,
    changePasswordValidationSchema,
    forgetPasswordValidationSchema,
    resetPasswordValidationSchema,
    refreshTokenValidationSchema,
};
