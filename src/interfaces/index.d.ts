import { UserJwtPayload } from "../app/middlewares/auth";

declare global {
    namespace Express {
        interface Request {
            user: UserJwtPayload;
        }
    }
}
