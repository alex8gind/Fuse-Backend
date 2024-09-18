const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email configuration
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// SMS configuration (using Twilio as an example)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendVerificationEmail = async (to, token) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Email Verification',
        text: `Your verification token is: ${token}`
    };

    await emailTransporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (to, token) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Password Reset',
        text: `Your password reset token is: ${token}`
    };

    await emailTransporter.sendMail(mailOptions);
};

const sendVerificationSMS = async (to, token) => {
    await twilioClient.messages.create({
        body: `Your verification token is: ${token}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
    });
};

const sendPasswordResetSMS = async (to, token) => {
    await twilioClient.messages.create({
        body: `Your password reset token is: ${token}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
    });
};

const sendWithPhoneOrEmail = async (to, token, type, method) => {
    if (method === 'email') {
        if (type === 'verification') {
            await sendVerificationEmail(to, token);
        } else if (type === 'passwordReset') {
            await sendPasswordResetEmail(to, token);
        }
    } else if (method === 'sms') {
        if (type === 'verification') {
            await sendVerificationSMS(to, token);
        } else if (type === 'passwordReset') {
            await sendPasswordResetSMS(to, token);
        }
    } else {
        throw new Error('Invalid notification method');
    }
};

module.exports = {
    sendWithPhoneOrEmail
};