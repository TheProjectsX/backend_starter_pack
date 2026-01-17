export const generateEmailVerifyTemplate = (link: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Tahoma,Verdana,sans-serif;color:#334155;">
    <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,.08);">

        <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:24px;text-align:center;">
            <h2 style="margin:0;color:#ffffff;font-size:24px;">Verify Your Email</h2>
        </div>

        <div style="padding:32px;text-align:center;">
            <p style="font-size:16px;margin:0 0 12px;">Hello,</p>
            <p style="font-size:15px;color:#64748b;margin:0 0 24px;">
                Please confirm your email address to complete your registration.
            </p>

            <a href="${link}"
               style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;
                      text-decoration:none;border-radius:8px;font-weight:600;">
                Verify Email
            </a>

            <p style="font-size:13px;color:#64748b;margin-top:24px;">
                This link is valid for <strong>15 minutes</strong>.
            </p>
        </div>

        <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;">
            © ${new Date().getFullYear()} ${process.env.COMPANY_NAME}. All rights reserved.
        </div>
    </div>
</body>
</html>
`;


export const generateVerifyOTPTemplate = (otp: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification Code</title>
</head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:Segoe UI,Tahoma,Verdana,sans-serif;color:#334155;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,.08);">

        <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:24px;text-align:center;">
            <h2 style="margin:0;color:#ffffff;font-size:24px;">Verify Your Email</h2>
        </div>

        <div style="padding:32px;">
            <p style="font-size:15px;margin-bottom:16px;">
                Use the OTP below to verify your email address:
            </p>

            <div style="text-align:center;margin:32px 0;">
                <div style="display:inline-block;padding:16px 40px;background:#2563eb;color:#ffffff;
                            font-size:26px;font-weight:700;letter-spacing:4px;border-radius:8px;">
                    ${otp}
                </div>
            </div>

            <p style="font-size:14px;color:#64748b;">
                This code is valid for <strong>15 minutes</strong>. Do not share it.
            </p>
        </div>

        <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;">
            © ${new Date().getFullYear()} ${process.env.COMPANY_NAME}. All rights reserved.
        </div>
    </div>
</body>
</html>
`;


export const generateForgetPasswordTemplate = (link: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
</head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:Segoe UI,Tahoma,Verdana,sans-serif;color:#334155;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,.08);">

        <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:24px;text-align:center;">
            <h2 style="margin:0;color:#ffffff;font-size:24px;">Reset Your Password</h2>
        </div>

        <div style="padding:32px;">
            <p style="font-size:15px;margin-bottom:20px;">
                We received a request to reset your password.
            </p>

            <div style="text-align:center;margin:28px 0;">
                <a href="${link}"
                   style="display:inline-block;padding:14px 28px;background:#2563eb;
                          color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
                    Reset Password
                </a>
            </div>

            <p style="font-size:14px;color:#64748b;">
                This code is valid for <strong>15 minutes</strong>. Do not share it.
            </p>
        </div>

        <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;">
            © ${new Date().getFullYear()} ${process.env.COMPANY_NAME}. All rights reserved.
        </div>
    </div>
</body>
</html>
`;

