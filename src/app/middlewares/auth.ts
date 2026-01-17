import { NextFunction, Request, Response } from "express";

import { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../config";

import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import prisma from "../../shared/prisma";
import { UserRole } from "@prisma/client";

export type UserJwtPayload = {
    id: string;
    email: string;
    role: UserRole;
};

const auth = (...roles: UserRole[]) => {
    return async (
        req: Request & { user?: JwtPayload },
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const token = req.headers.authorization;

            if (!token) {
                throw new ApiError(
                    StatusCodes.UNAUTHORIZED,
                    "You are not authorized!",
                );
            }

            const verifiedUser = jwtHelpers.verifyToken(
                token,
                config.jwt.jwt_secret as Secret,
            );

            const user = await prisma.user.findUnique({
                where: {
                    email: verifiedUser.email,
                },
            });

            if (!user) {
                throw new ApiError(
                    StatusCodes.UNAUTHORIZED,
                    "You are not authorized!",
                );
            }

            if (roles.length && !roles.includes(verifiedUser.role)) {
                throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden!");
            }

            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
            };

            next();
        } catch (err) {
            next(err);
        }
    };
};

export default auth;
