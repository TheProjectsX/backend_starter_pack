import nodemailer from "nodemailer";
import config from "../../config";
import ApiError from "../../errors/ApiErrors";

const emailSender = async (subject: string, email: string, html: string) => {
    const transporter = nodemailer.createTransport({
        // For Gmail
        service: "gmail",
        // For other service
        // host: config.smtp.host,
        // port: config.smtp.port,
        auth: {
            user: config.smtp.email,
            pass: config.smtp.pass,
        },
    });

    const emailTransport = transporter;

    const mailOptions = {
        from: `"${config.company_name}" <${config.smtp.sender}>`,
        to: email,
        subject,
        html,
    };

    // Send the email
    try {
        const info = await emailTransport.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new ApiError(500, "Error sending email");
    }
};

export default emailSender;
