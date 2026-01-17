const template = ({
    pascal,
    camel,
    subdir = false,
}) => `import { Router } from "express";
import ${pascal}Controllers from "./${camel}.controllers";
import auth from "${subdir ? "../../" : ""}../../middlewares/auth";
import ${pascal}Validations from "./${camel}.validations";

const router = Router();


export const ${pascal}Routes = router;`;

export default template;
