import { Router } from "express";
import UsersControllers from "./users.controllers";
import auth from "../../middlewares/auth";
import UserValidations from "./users.validations";
import { upload } from "../../../helpers/file/upload";
import { parseBodyData } from "../../middlewares/parseBodyData";

const router = Router();

router.get("/me", auth(), UsersControllers.getCurrentUser);

router.patch(
    "/update-profile",
    auth(),
    upload.single("avatar"),
    parseBodyData,
    UsersControllers.updateProfile,
);

export const UsersRoutes = router;
