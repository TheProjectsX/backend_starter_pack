export const generateOTP = (expiryMinutes = 15) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    return { otp, otpExpiry };
};
