import { Server } from "http";
import app from "./app";
import config from "./config";
import { getLocalIP } from "./utils/localIp";

let server: Server;

// Main function to start the server
function main() {
    try {
        server = app.listen(config.port, () => {
            const ip = getLocalIP();
            console.log(`\nServer is running on:
    http://localhost:${config.port}
    http://${ip}:${config.port}\n`);
        });
    } catch (error) {
        console.log(error);
    }
}

// Start the server
main();

process.on("unhandledRejection", (err) => {
    console.log(`😈 unhandledRejection is detected , shutting down ...`, err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});

process.on("uncaughtException", () => {
    console.log(`😈 uncaughtException is detected , shutting down ...`);
    process.exit(1);
});
