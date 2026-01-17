import fs from "fs";
import { getModulePaths } from "./utils/helpers.mjs";
import routeTemplate from "./templates/routes.template.mjs";
import controllerTemplate from "./templates/controllers.template.mjs";
import serviceTemplate from "./templates/services.template.mjs";
import validationsTemplate from "./templates/validations.template.mjs";

let moduleName = process.argv[2];
let baseName = process.argv[3];
if (!moduleName) {
    console.error(
        "❌ Please provide a module name. Example: npm run cModule Investor",
    );
    process.exit(1);
}

const { baseDir, pascal, camel, lower } = getModulePaths(moduleName, baseName);

if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(`📁 Created: ${baseDir}`);
}

const files = [
    {
        name: `${camel}.routes.ts`,
        content: routeTemplate({ pascal, camel, lower, subdir: !!baseName }),
    },
    {
        name: `${camel}.controllers.ts`,
        content: controllerTemplate({ pascal, camel, subdir: !!baseName }),
    },
    {
        name: `${camel}.services.ts`,
        content: serviceTemplate({ pascal, camel, lower, subdir: !!baseName }),
    },
    {
        name: `${camel}.validations.ts`,
        content: validationsTemplate({
            pascal,
            camel,
            lower,
            subdir: !!baseName,
        }),
    },
];

files.forEach(({ name, content }) => {
    const filePath = `${baseDir}/${name}`;

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ Created: ${filePath}`);
    } else {
        console.log(`⚠️ Skipped (already exists): ${filePath}`);
    }
});
