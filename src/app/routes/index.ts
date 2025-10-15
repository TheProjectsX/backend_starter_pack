import express from "express";

import { AuthRoutes } from "../modules/Auth/auth.routes";

const router = express.Router();

const moduleRoutes = [
    {
        path: "/auth",
        handlers: [AuthRoutes],
    },
] satisfies {
    path: string;
    handlers: any[];
}[];

moduleRoutes.forEach((route) => router.use(route.path, ...route.handlers));

export default router;
