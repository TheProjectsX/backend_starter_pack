/* eslint-disable @typescript-eslint/no-explicit-any */

import config from "../config";

export const logger = (...data: any[]) => {
    if (config.env === "development") {
        console.log(...data);
    }
};
