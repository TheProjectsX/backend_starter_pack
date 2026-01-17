import prisma from "../../../shared/prisma";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../../utils/queryBuilder";
import config from "../../../config";
import { Prisma } from "@prisma/client";
import { UserJwtPayload } from "../../middlewares/auth";
import { UserProfileUpdateInput } from "./users.validations";
import ApiError from "../../../errors/ApiErrors";
import { deleteFile } from "../../../helpers/file/delete";

// Get Me (/users/me - Current User Profile)
const getCurrentUser = async (user: UserJwtPayload) => {
    const userData = await prisma.user.findUnique({
        where: {
            id: user.id,
        },
        select: {
            id: true,
            email: true,
            role: true,
            profile: {
                omit: {
                    userId: true,
                    createdAt: true,
                    updatedAt: true,
                    id: true,
                },
            },
        },
    });

    return {
        message: "User profile fetched successfully",
        data: userData,
    };
};

// Update Profile Info
const updateProfile = async (
    payload: UserProfileUpdateInput,
    user: UserJwtPayload,
) => {
    const profile = await prisma.profile.findUnique({
        where: {
            userId: user.id,
        },
    });

    if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Profile not found");
    }

    const updatedProfile = await prisma.profile.update({
        where: {
            userId: user.id,
        },
        data: payload,
    });

    // Delete the old avatar if new is provided
    if (payload.avatar && profile.avatar) {
        await deleteFile(profile.avatar);
    }

    return {
        message: "User profile updated successfully",
        data: updatedProfile,
    };
};

export default {
    getCurrentUser,
    updateProfile,
};
