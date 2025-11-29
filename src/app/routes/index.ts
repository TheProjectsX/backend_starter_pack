import express, { RequestHandler } from "express";

import { AuthRoutes } from "../modules/Auth/auth.routes";

const router = express.Router();

const moduleRoutes = [
    {
        path: "/auth",
        handlers: [AuthRoutes],
    },
] satisfies {
    path: string;
    handlers: RequestHandler[];
}[];

moduleRoutes.forEach((route) => router.use(route.path, ...route.handlers));

export default router;
