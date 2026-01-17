import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { UserJwtPayload } from "../app/middlewares/auth";

const generateToken = (
    payload: UserJwtPayload,
    secret: Secret,
    expiresIn: string,
): string => {
    const token = jwt.sign(payload, secret, {
        algorithm: "HS256",
        expiresIn,
    } as SignOptions);

    return token;
};

const verifyToken = (token: string, secret: Secret) => {
    return jwt.verify(token, secret) as UserJwtPayload;
};

export const jwtHelpers = {
    generateToken,
    verifyToken,
};
