import { z } from "zod";

const userRegisterSchema = z
    .object({
        name: z.string(),
        email: z.email(),
        phone: z.string(),
        password: z.string(),
    })
    .strict();
export type UserRegisterInput = z.infer<typeof userRegisterSchema>;

const changePasswordValidationSchema = z.object({
    oldPassword: z.string().min(8),
    newPassword: z.string().min(8),
});
export type ChangePasswordInput = z.infer<
    typeof changePasswordValidationSchema
>;

const refreshTokenValidationSchema = z.object({
    cookies: z.object({
        refreshToken: z.string(),
    }),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenValidationSchema>;

export const AuthValidation = {
    changePasswordValidationSchema,
    userRegisterSchema,
    refreshTokenValidationSchema,
};
