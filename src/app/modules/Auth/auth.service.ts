import {
    comparePassword,
    hashPassword,
} from "../../../helpers/passwordHelpers";

import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import prisma from "../../../shared/prisma";
import emailSender from "../../../helpers/emailSender/emailSender";
import { Request } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import {
    generateEmailVerifyTemplate,
    GenerateForgetPasswordTemplate,
} from "./auth.template";
import { StatusCodes } from "http-status-codes";

const register = async (req: Request) => {
    const payload = req?.body;

    const isUserExists = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (isUserExists) {
        throw new ApiError(
            StatusCodes.CONFLICT,
            "user already exist with this email"
        );
    }

    const hashedPassword: string = await hashPassword(payload.password);
    const response = prisma.$transaction(async (TX) => {
        const user = await TX.user.create({
            data: { ...payload, password: hashedPassword },
        });

        const payloadData = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payloadData, config.jwt.jwt_secret as Secret, {
            algorithm: "HS256",
            expiresIn: "30m",
        });

        const verifyLink = `${config.backend_url}/api/v1/auth/verify-email?token=${token}`;

        const html = generateEmailVerifyTemplate(verifyLink);

        await emailSender(
            "Email verification link for Investor.io",
            user.email,
            html
        );

        const { password, ...result } = user;

        return result;
    });

    return {
        message: "User Registration successful",
        data: response,
    };
};
// user login
const loginUserWithEmail = async (payload: {
    email: string;
    password: string;
}) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
        },
    });
    if (!userData) {
        throw new ApiError(400, "User not found");
    }

    if (!payload.password || !userData?.password) {
        throw new Error("Password is required");
    }

    const isCorrectPassword = await comparePassword(
        payload.password,
        userData.password
    );

    if (!isCorrectPassword) {
        throw new ApiError(400, "Password incorrect!");
    }

    if (userData.status === "INACTIVE")
        throw new ApiError(
            StatusCodes.FORBIDDEN,
            "Your account has been Blocked"
        );

    if (!userData?.isEmailVerified) {
        try {
            console.log("email verification called");
            const payloadData = {
                id: userData.id,
                email: userData.email,
                role: userData.role,
            };

            const token = jwt.sign(
                payloadData,
                config.jwt.jwt_secret as Secret,
                {
                    algorithm: "HS256",
                    expiresIn: "30m",
                }
            );
            const verifyLink = `${config.backend_url}/api/v1/auth/verify-email?token=${token}`;

            const html = generateEmailVerifyTemplate(verifyLink);

            await emailSender(
                "Email verification link from Investor.io",
                userData.email,
                html
            );
        } catch (error) {
            console.log(error);
        }
    }

    const accessToken = jwtHelpers.generateToken(
        {
            id: userData.id,
            email: userData.email,
            role: userData.role,
        },
        config.jwt.jwt_secret as Secret,
        // config.jwt.expires_in as string
        config.jwt.expires_in as string
    );

    const refreshToken = jwtHelpers.generateToken(
        {
            id: userData.id,
            email: userData.email,
            role: userData.role,
        },
        config.jwt.refresh_token_secret as Secret,
        // config.jwt.refresh_token_expires_in as string
        config.jwt.refresh_token_expires_in as string
    );

    const message = userData.isEmailVerified
        ? "Login successful"
        : "Verify your Email first";

    return {
        message,
        data: {
            refreshToken,
            accessToken,
            isEmailVerified: userData.isEmailVerified,
        },
    };
};
const enterOtp = async (payload: {
    otp: string;
    email: string;
    keepMeLogin?: boolean;
}) => {
    const userData = await prisma.user.findFirst({
        where: {
            email: payload.email,
            otp: payload.otp,
        },
    });

    if (!userData) {
        throw new ApiError(404, "Your otp is incorrect");
    }

    if (userData.otpExpiry && userData.otpExpiry < new Date()) {
        throw new ApiError(400, "Your otp has been expired");
    }

    let accessToken;
    let refreshToken;

    accessToken = jwtHelpers.generateToken(
        {
            id: userData.id,
            email: userData.email,
            role: userData.role,
        },
        config.jwt.jwt_secret as Secret,
        config.jwt.expires_in as string
    );

    refreshToken = jwtHelpers.generateToken(
        {
            id: userData.id,
            email: userData.email,
            role: userData.role,
        },
        config.jwt.refresh_token_secret as Secret,
        config.jwt.refresh_token_expires_in as string
    );

    await prisma.user.update({
        where: {
            id: userData.id,
        },
        data: {
            otp: null,
            otpExpiry: null,
        },
    });

    const data = {
        accessToken,
        refreshToken,
    };

    return {
        message: "OTP Verification successful",
        data,
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

// get user profile
const getMyProfile = async (userToken: string) => {
    const decodedToken = jwtHelpers.verifyToken(
        userToken,
        config.jwt.jwt_secret!
    );

    const userData = await prisma.$transaction(async (TransactionClient) => {
        const userProfile = await TransactionClient.user.findUnique({
            where: {
                id: decodedToken?.id,
            },
            select: {
                id: true,
                email: true,
                role: true,

                createdAt: true,
                updatedAt: true,
            },
        });

        if (!userProfile) {
            throw new ApiError(404, "User not found");
        }

        return userProfile;
    });

    return {
        message: "User Info parsed",
        data: userData,
    };
};

// Change Password
const changePassword = async (
    user: JwtPayload,
    payload: {
        oldPassword: string;
        newPassword: string;
    }
) => {
    if (!payload.oldPassword || !payload.newPassword) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Body Provided");
    }

    const userInfo = await prisma.user.findUnique({
        where: { id: user?.id },
    });

    if (!userInfo || !userInfo?.password) {
        throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            "Unauthenticated Request!"
        );
    }

    const isPasswordValid = await comparePassword(
        payload.oldPassword,
        userInfo?.password
    );

    if (!isPasswordValid) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Password is Incorrect");
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
    return { message: "Password Change successful" };
};

// Forgot Password
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
        config.jwt.reset_pass_secret as Secret,
        config.jwt.reset_pass_token_expires_in as string
    );

    const resetPassLink =
        config.reset_pass_link +
        `?userId=${userData.id}&token=${resetPassToken}`;

    await emailSender(
        "Reset Your Password",
        userData.email,
        GenerateForgetPasswordTemplate(resetPassLink)
    );
    return {
        message: "Password Reset Instruction sent to Email",
        data: {
            url: resetPassLink,
        },
    };
};

// Refresh Token
const refreshToken = async (payload: { refreshToken: string }) => {
    if (!payload.refreshToken) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "refreshToken is required");
    }

    let decrypted;

    try {
        decrypted = jwtHelpers.verifyToken(
            payload.refreshToken,
            config.jwt.jwt_secret as string
        );
    } catch (error) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Refresh Token is Invalid or Expired"
        );
    }

    // checking if the user is exist
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
        config.jwt.expires_in as string
    );

    return {
        data: { accessToken },
        message: "Access Token generated",
    };
};

// reset password
const resetPassword = async (
    token: string,
    payload: { email: string; password: string }
) => {
    const userData = await prisma.user.findUnique({
        where: {
            email: payload.email,
        },
    });

    if (!userData) {
        throw new ApiError(404, "User not found");
    }

    const isValidToken = jwtHelpers.verifyToken(
        token,
        config.jwt.reset_pass_secret as Secret
    );

    if (!isValidToken) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden!");
    }

    // hash password
    const password = await hashPassword(payload.password);

    // update into database
    await prisma.user.update({
        where: {
            email: payload.email,
        },
        data: {
            password,
        },
    });
    return { message: "Password Reset successful" };
};

export const AuthServices = {
    loginUserWithEmail,
    enterOtp,
    register,
    getMyProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshToken,
};
