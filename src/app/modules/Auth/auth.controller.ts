import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AuthServices } from "./auth.service";
import {
    emailVerifiedFailedTemplate,
    emailVerifiedSuccessTemplate,
} from "./auth.template";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import prisma from "../../../shared/prisma";

const register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.register(req);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.data,
    });
});

const loginUserWithEmail = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.loginUserWithEmail(req.body);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: config.env !== "development",
        sameSite: "lax",
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.data,
    });
});

const verifyEmail = catchAsync(async (req, res) => {
    const { token } = req.query;

    const templateError = emailVerifiedFailedTemplate();
    // If no token provided
    if (!token) {
        return res.status(400).send(templateError);
    }

    let decodedToken;
    try {
        decodedToken = jwtHelpers.verifyToken(
            token as string,
            config.jwt.jwt_secret as string,
        );
    } catch (error) {
        return res.status(400).send(templateError);
    }

    // If token is invalid or decoding failed
    if (!decodedToken || !decodedToken.email) {
        return res.status(400).send(templateError);
    }

    // Update user verification status
    await prisma.user.update({
        where: { email: decodedToken.email },
        data: { isEmailVerified: true },
    });

    // Success Email Template

    // Send success template
    return res.status(200).send(emailVerifiedSuccessTemplate());
});

const enterOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.enterOtp(req.body);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: config.env !== "development",
        sameSite: "lax",
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.data,
    });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
    // Clear the token cookie
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Logout successful",
    });
});

// get user profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const userToken = req.headers.authorization;
    const result = await AuthServices.getMyProfile(userToken as string);

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: result.message,
        data: result.data,
    });
});

// Change Password
const changePassword = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;

    const result = await AuthServices.changePassword(user, req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result.message,
    });
});

// Forgot Password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.forgotPassword(req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result.message,
    });
});

// Refresh Token
const refreshToken = catchAsync(async (req, res) => {
    const result = await AuthServices.refreshToken(req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});
const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const token = req.headers.authorization || "";

    const result = await AuthServices.resetPassword(token, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });
});

export const AuthController = {
    loginUserWithEmail,
    enterOtp,
    logoutUser,
    getMyProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    register,
    verifyEmail,
    refreshToken,
};
