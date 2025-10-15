import path from "path";

export const toPascal = (str) => str.charAt(0).toUpperCase() + str.slice(1);
export const toCamel = (str) => str.charAt(0).toLowerCase() + str.slice(1);

export const getModulePaths = (moduleName) => {
    const pascal = toPascal(moduleName);
    return {
        baseDir: path.join(process.cwd(), "src/app/modules", pascal),
        pascal,
        camel: toCamel(moduleName),
        lower: moduleName.toLowerCase(),
        upper: moduleName.toUpperCase(),
    };
};
