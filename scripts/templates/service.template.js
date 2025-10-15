const template = ({
    pascal,
    camel,
}) => `import { StatusCodes } from 'http-status-codes';
import prisma from "../../../shared/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import config from "../../../config";
import { Prisma } from "@prisma/client";


export default {};`;

export default template;
