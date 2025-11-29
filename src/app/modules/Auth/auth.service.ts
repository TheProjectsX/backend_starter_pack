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
import { ChangePasswordInput, UserRegisterInput } from "./auth.validation";
import { generateOTP } from "./auth.utils";

const register = async (payload: UserRegisterInput) => {
    const isUserExists = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (isUserExists) {
        throw new ApiError(
            StatusCodes.CONFLICT,
            "User with this Email already exists!",
        );
    }

    const { otp, otpExpiry } = generateOTP();

    const hashedPassword: string = await hashPassword(payload.password);
    const response = await prisma.user.create({
        data: { ...payload, otp, otpExpiry, password: hashedPassword },
        omit: { password: true },
    });

    const html = generateVerifyOTPTemplate(otp);

    await emailSender(
        `Account Verification Code - ${config.company_name}`,
        response.email,
        html,
    );

    return {
        message: "Verification code sent",
    };
};

const loginWithEmail = async (payload: { email: string; password: string }) => {
    const userData = await prisma.user.findUniqueOrThrow({
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
    if (userData.deleted) throw new ApiError(400, "Invalid Credentials");

    if (!userData?.verified) {
        const { otp, otpExpiry } = generateOTP();

        await prisma.user.update({
            where: {
                id: userData.id,
            },
            data: { otp, otpExpiry },
        });

        const html = generateVerifyOTPTemplate(otp);
        await emailSender(
            `Account Verification Code - ${config.company_name}`,
            userData.email,
            html,
        );

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
    await emailSender(
        `Account Verification Code - ${config.company_name}`,
        userData.email,
        html,
    );

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
        throw new ApiError(404, "User not found");
    }

    if (userData.otp !== payload.otp) {
        throw new ApiError(404, "Incorrect OTP");
    }

    if (userData.otpExpiry && userData.otpExpiry < new Date()) {
        throw new ApiError(400, "OTP expired");
    }

    await prisma.user.update({
        where: {
            id: userData.id,
        },
        data: {
            otp: null,
            otpExpiry: null,
        },
    });

    return {
        message: "OTP Verification successful",
    };
};

// const loginWithGoogle = async (payload: {
// 	name:string
// 	email: string;
// 	profileImage: string;
// }) => {
// 	const userData = await prisma.user.findUnique({
// 		where: {
// 			email: payload.email,
// 		},
// 	});

// 	if (!userData) {
// 		const newUser = await prisma.user.create({
// 			data: {
// 				name:payload.name,
// 				email: payload.email,

// 			},
// 		});

// 		const accessToken = jwtHelpers.generateToken(
// 			{
// 				id: newUser.id,
// 				email: newUser.email,
// 				role: UserRole.NORMAL_USER,
// 			},
// 			config.jwt.jwt_secret as Secret,
// 			config.jwt.expires_in as string
// 		);

// 		const refreshToken = jwtHelpers.generateToken(
// 			{
// 				id: newUser.id,
// 				email: newUser.email,
// 				role: UserRole.NORMAL_USER,
// 			},
// 			config.jwt.refresh_token_secret as Secret,
// 			config.jwt.expires_in as string
// 		);

// 		return { message: "User created successfully", accessToken, refreshToken };
// 	}

// 	if (userData.provider !== Provider.GOOGLE) {
// 		throw new ApiError(400, "Please login with your email and password");
// 	}

// 	if (userData.status === UserStatus.INACTIVE) {
// 		throw new ApiError(403, "Your account is Suspended");
// 	}

// 	const accessToken = jwtHelpers.generateToken(
// 		{
// 			id: userData.id,
// 			email: userData.email,
// 			role: userData.role,
// 		},
// 		config.jwt.jwt_secret as Secret,
// 		config.jwt.expires_in as string
// 	);

// 	const refreshToken = jwtHelpers.generateToken(
// 		{
// 			id: userData.id,
// 			email: userData.email,
// 			role: userData.role,
// 		},
// 		config.jwt.refresh_token_secret as Secret,
// 		config.jwt.expires_in as string
// 	);

// 	await prisma.user.update({
// 		where: {
// 			id: userData.id,
// 		},
// 		data: {
// 			refreshToken,
// 		},
// 	});

// 	return {
// 		accessToken,
// 		refreshToken,
// 	};
// };

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

const forgotPassword = async (payload: { email: string }) => {
    const userData = await prisma.user.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (!userData) {
        throw new ApiError(404, "User not found");
    }

    const resetPassToken = jwtHelpers.generateToken(
        { email: userData.email, role: userData.role },
        config.jwt.reset_token_secret as Secret,
        config.jwt.reset_token_expires_in as string,
    );

    const resetPassLink =
        config.url.reset_pass +
        `?userId=${userData.id}&token=${resetPassToken}`;

    const html = generateForgetPasswordTemplate(resetPassLink);

    await emailSender("Reset Your Password", userData.email, html);
    return {
        message: "Password Reset Instructions sent to Email",
    };
};

const refreshToken = async (payload: { refreshToken: string }) => {
    if (!payload.refreshToken) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "refreshToken is required");
    }

    let decrypted;

    try {
        decrypted = jwtHelpers.verifyToken(
            payload.refreshToken,
            config.jwt.jwt_secret as string,
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

const resetPassword = async (payload: { token: string; password: string }) => {
    let decrypted;

    try {
        decrypted = jwtHelpers.verifyToken(
            payload.token,
            config.jwt.jwt_secret as string,
        );
    } catch (error) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Token");
    }

    const userData = await prisma.user.findUniqueOrThrow({
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
