import {
    comparePassword,
    hashPassword,
} from "../../../helpers/passwordHelpers";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import prisma from "../../../shared/prisma";
import emailSender from "../../../helpers/emailSender/emailSender";
import { JwtPayload, Secret } from "jsonwebtoken";
import {
    generateForgetPasswordTemplate,
    generateVerifyOTPTemplate,
} from "./auth.template";
import { StatusCodes } from "http-status-codes";
import {
    ChangePasswordInput,
    ForgetPasswordInput,
    ResetPasswordInput,
    UserRegisterInput,
} from "./auth.validation";
import { generateOTP } from "./auth.utils";

const register = async (payload: UserRegisterInput) => {
    const { name, phone, email, password } = payload;

    const userExists = await prisma.user.findUnique({
        where: { email },
    });

    if (userExists) {
        throw new ApiError(
            StatusCodes.CONFLICT,
            "User with this Email already exists!",
        );
    }

    const { otp, otpExpiry } = generateOTP();

    const hashedPassword: string = await hashPassword(password);
    const response = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
            profile: {
                create: {
                    name,
                    phone
                },
            },
        },
        omit: { password: true },
    });

    const html = generateVerifyOTPTemplate(otp);
    await emailSender({
        email: response.email,
        subject: `Account Verification Code - ${config.company_name}`,
        html,
    });

    return {
        code: otp,
        message: "Verification code sent",
    };
};

const loginWithEmail = async (payload: { email: string; password: string }) => {
    const userData = await prisma.user.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (!userData) {
        throw new ApiError(400, "Invalid Credentials");
    }

    if (!payload.password || !userData?.password) {
        throw new Error("Password is required");
    }

    const isCorrectPassword = await comparePassword(
        payload.password,
        userData.password,
    );

    if (!isCorrectPassword) {
        throw new ApiError(400, "Invalid Credentials");
    }

    if (userData.status === "INACTIVE")
        throw new ApiError(StatusCodes.FORBIDDEN, "This account is Inactive");
    // if (userData.status === "DELETED")
    //     throw new ApiError(400, "Invalid Credentials");

    if (!userData?.verified) {
        const { otp, otpExpiry } = generateOTP();

        await prisma.user.update({
            where: {
                id: userData.id,
            },
            data: { otp, otpExpiry },
        });

        const html = generateVerifyOTPTemplate(otp);
        await emailSender({
            email: userData.email,
            subject: `Account Verification Code - ${config.company_name}`,
            html,
        });

        return {
            message: "Check Email and Verify your account first!",
        };
    }

    const accessToken = jwtHelpers.generateToken(
        {
            id: userData.id,
            email: userData.email,
            role: userData.role,
        },
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_secret_expires_in as string,
    );

    const refreshToken = jwtHelpers.generateToken(
        {
            id: userData.id,
            email: userData.email,
            role: userData.role,
        },
        config.jwt.refresh_token_secret as Secret,
        config.jwt.refresh_token_expires_in as string,
    );

    return {
        message: "Login successful",
        data: {
            refreshToken,
            accessToken,
        },
    };
};

const resendOTP = async (payload: { email: string }) => {
    const userData = await prisma.user.findFirst({
        where: {
            email: payload.email,
        },
    });

    if (!userData) {
        throw new ApiError(404, "User not found");
    }
    if (userData.verified) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Account already verified");
    }

    const { otp, otpExpiry } = generateOTP();

    await prisma.user.update({
        where: {
            id: userData.id,
        },
        data: { otp, otpExpiry },
    });

    const html = generateVerifyOTPTemplate(otp);
    await emailSender({
        email: userData.email,
        subject: `Account Verification Code - ${config.company_name}`,
        html,
    });

    return {
        message: "OTP Resent Successfully!",
    };
};

const verifyOTP = async (payload: { otp: string; email: string }) => {
    const userData = await prisma.user.findFirst({
        where: {
            email: payload.email,
        },
    });

    if (!userData) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    if (userData.otp !== payload.otp) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Incorrect OTP");
    }

    if (userData.otpExpiry && userData.otpExpiry < new Date()) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "OTP expired");
    }

    await prisma.user.update({
        where: {
            id: userData.id,
        },
        data: {
            otp: null,
            otpExpiry: null,
            verified: true,
        },
    });

    return {
        message: "OTP Verification successful",
    };
};

const changePassword = async (
    user: JwtPayload,
    payload: ChangePasswordInput,
) => {
    if (!payload.oldPassword || !payload.newPassword) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Body Provided");
    }

    const userData = await prisma.user.findUnique({
        where: { id: user?.id },
    });

    if (!userData) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
    }

    if (!userData?.password) {
        throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            "Unauthenticated Request!",
        );
    }

    const passwordValid = await comparePassword(
        payload.oldPassword,
        userData?.password,
    );

    if (!passwordValid) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Incorrect Password");
    }

    const hashedPassword = await hashPassword(payload.newPassword);

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            password: hashedPassword,
        },
    });
    return { message: "Password Changed successfully" };
};

const forgotPassword = async (payload: ForgetPasswordInput) => {
    const userData = await prisma.user.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (!userData) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    const resetPassToken = jwtHelpers.generateToken(
        { email: userData.email, role: userData.role },
        config.jwt.reset_token_secret as Secret,
        config.jwt.reset_token_expires_in as string,
    );
    console.log(resetPassToken)

    const resetPassLink =
        config.url.reset_pass +
        `?userId=${userData.id}&token=${resetPassToken}`;

    const html = generateForgetPasswordTemplate(resetPassLink);
    await emailSender({
        email: userData.email,
        subject: `Password Reset Request - ${config.company_name}`,
        html,
    });

    return {
        message: "Password Reset Instructions sent to Email",
    };
};

const resetPassword = async (payload: ResetPasswordInput) => {
    let decrypted;

    try {
        decrypted = jwtHelpers.verifyToken(
            payload.token,
            config.jwt.reset_token_secret as string,
        );
    } catch (error) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Token");
    }

    const userData = await prisma.user.findUnique({
        where: {
            email: decrypted.email,
        },
    });

    if (!userData) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    const password = await hashPassword(payload.password);

    // update into database
    await prisma.user.update({
        where: {
            id: userData.id,
        },
        data: {
            password,
        },
    });
    return { message: "Password Reset successful" };
};

const refreshToken = async (payload: { refreshToken: string }) => {
    if (!payload.refreshToken) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "refreshToken is required");
    }

    let decrypted;

    try {
        decrypted = jwtHelpers.verifyToken(
            payload.refreshToken,
            config.jwt.refresh_token_secret as string,
        );
    } catch (error) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Refresh Token is Invalid or Expired",
        );
    }

    const userData = await prisma.user.findUnique({
        where: { id: decrypted.id },
    });

    if (!userData) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthenticated Request");
    }

    const jwtPayload = {
        id: userData.id,
        role: userData.role,
        email: userData.email,
    };

    const accessToken = jwtHelpers.generateToken(
        jwtPayload,
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_secret_expires_in as string,
    );

    return {
        data: { accessToken },
        message: "Access Token generated",
    };
};

export const AuthServices = {
    register,
    loginWithEmail,
    resendOTP,
    verifyOTP,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshToken,
};
