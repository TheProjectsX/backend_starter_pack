import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
    env: process.env.NODE_ENV,
    port: process.env.PORT || 5000,
    company_name: process.env.COMPANY_NAME,
    url: {
        frontend: process.env.FRONTEND_URL,
        backend: process.env.BACKEND_URL,
        uploads: process.env.BACKEND_UPLOADS_URL,
        reset_pass: process.env.RESET_PASS_URL
    },
    stripe: {
        secret_key: process.env.STRIPE_SECRET_KEY,
        webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
        client_id: process.env.STRIPE_CLIENT_ID,
    },
    jwt: {
        jwt_secret: process.env.JWT_SECRET,
        jwt_secret_expires_in: process.env.JWT_SECRET_EXPIRES_IN,
        refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
        refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN,
        reset_token_secret: process.env.RESET_TOKEN_SECRET,
        reset_token_expires_in: process.env.RESET_TOKEN_EXPIRES_IN,
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        email: process.env.EMAIL,
        pass: process.env.APP_PASS,
        sender: process.env.SENDER_EMAIL
    },
    paypal: {
        client_id: process.env.PAYPEL_CLIENT_ID,
        client_secret: process.env.PAYPAL_CLIENT_SECRET,
        mode: process.env.PAYPAL_MODE,
    },
    sendGrid: {
        api_key: process.env.SENDGRID_API_KEY,
        email_from: process.env.SENDGRID_EMAIL,
    },
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        bucketName: process.env.AWS_BUCKET_NAME,
    },
    password: {
        salt: process.env.PASSWORD_SALT,
    },
};
