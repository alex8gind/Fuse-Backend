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
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
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
    await sendEmail(to, 'Email Verification',
        `<p>Please click the following link to verify your email:</p>
         <a href="${process.env.FRONTEND_URL}/verify/${token}">Verify Email</a>`);
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
    console.log(`Sending ${type} via ${method} to ${to}`);
    try {
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
            // SMS sending logic
        } else {
            throw new Error('Invalid notification method');
        }
        console.log(`Successfully sent ${type} via ${method} to ${to}`);
    } catch (error) {
        console.error(`Error sending ${type} via ${method}:`, error);
        throw error;
    }
};

// const sendWithPhoneOrEmail = async (to, content, type, method) => {
//     if (method === 'email') {
//         if (type === 'verification') {
//             await sendVerificationEmail(to, content);
//         } else if (type === 'passwordReset') {
//             await sendPasswordResetEmail(to, content);
//         } else {
//             const subject = `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`;
//             await sendEmail(to, subject, content);
//         }
//     } else if (method === 'sms') {
//         if (type === 'verification') {
//             await sendVerificationSMS(to, content);
//         } else if (type === 'passwordReset') {
//             await sendPasswordResetSMS(to, content);
//         } else {
//             await sendSMS(to, content);
//         }
//     } else {
//         throw new Error('Invalid notification method');
//     }
// };

module.exports = {
    sendWithPhoneOrEmail,
    sendEmail,
    sendSMS
};