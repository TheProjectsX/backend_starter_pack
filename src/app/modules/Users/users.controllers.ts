import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import UsersServices from "./users.services";

const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await UsersServices.getCurrentUser(user);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.data,
    });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const payload = req.body;

    if (req.file) {
        payload.avatar = req.file.filename;
    }

    const result = await UsersServices.updateProfile(payload, user);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.data,
    });
});

export default {
    getCurrentUser,
    updateProfile,
};
