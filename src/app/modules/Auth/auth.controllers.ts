import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AuthServices } from "./auth.services";
import config from "../../../config";

const register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.register(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });
});

const loginWithEmail = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.loginWithEmail(req.body);

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

const resendOTP = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.resendOTP(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });
});

const verifyOTP = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.verifyOTP(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
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

const changePassword = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;

    const result = await AuthServices.changePassword(user, req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result.message,
    });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.forgotPassword(req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result.message,
    });
});

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

    const result = await AuthServices.resetPassword(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });
});

export const AuthController = {
    loginWithEmail,
    resendOTP,
    verifyOTP,
    logoutUser,
    changePassword,
    forgotPassword,
    resetPassword,
    register,
    refreshToken,
};
