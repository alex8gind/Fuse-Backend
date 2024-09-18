const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email configuration
const emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// SMS configuration (using Twilio)
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioClient = twilio('AC1234567890abcdef1234567890abcdef', 'your_auth_token_here');
const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };

    await emailTransporter.sendMail(mailOptions);
};

const sendSMS = async (to, body) => {
    await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
    });
};

const sendVerificationEmail = async (to, token) => {
    await sendEmail(to, 'Email Verification', `Your verification token is: ${token}`);
};

const sendPasswordResetEmail = async (to, token) => {
    await sendEmail(to, 'Password Reset', `Your password reset token is: ${token}`);
};

const sendVerificationSMS = async (to, token) => {
    await sendSMS(to, `Your verification token is: ${token}`);
};

const sendPasswordResetSMS = async (to, token) => {
    await sendSMS(to, `Your password reset token is: ${token}`);
};

const sendWithPhoneOrEmail = async (to, content, type, method) => {
    if (method === 'email') {
        if (type === 'verification') {
            await sendVerificationEmail(to, content);
        } else if (type === 'passwordReset') {
            await sendPasswordResetEmail(to, content);
        } else {
            const subject = `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`;
            await sendEmail(to, subject, content);
        }
    } else if (method === 'sms') {
        if (type === 'verification') {
            await sendVerificationSMS(to, content);
        } else if (type === 'passwordReset') {
            await sendPasswordResetSMS(to, content);
        } else {
            await sendSMS(to, content);
        }
    } else {
        throw new Error('Invalid notification method');
    }
};

module.exports = {
    sendWithPhoneOrEmail,
    sendEmail,
    sendSMS
};