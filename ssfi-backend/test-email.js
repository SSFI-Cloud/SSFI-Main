require('dotenv').config();
const nodemailer = require('nodemailer');

const SEND_TO = process.argv[2] || process.env.SMTP_USER;

async function testEmail() {
    console.log('\n?? SSFI Email Test');
    console.log('SMTP Host  : ' + process.env.SMTP_HOST);
    console.log('SMTP Port  : ' + process.env.SMTP_PORT);
    console.log('SMTP User  : ' + process.env.SMTP_USER);
    console.log('SMTP Pass  : ' + (process.env.SMTP_PASS ? 'SET (' + process.env.SMTP_PASS.length + ' chars)' : 'NOT SET'));
    console.log('Sending to : ' + SEND_TO + '\n');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    console.log('Verifying SMTP connection...');
    try {
        await transporter.verify();
        console.log('SMTP connection OK\n');
    } catch (err) {
        console.error('SMTP FAILED: ' + err.message);
        process.exit(1);
    }

    try {
        const info = await transporter.sendMail({
            from: '"SSFI" <' + process.env.SMTP_USER + '>',
            to: SEND_TO,
            subject: 'SSFI Email Test - Working!',
            text: 'Your SSFI email configuration is working correctly.',
        });
        console.log('Email sent! Message ID: ' + info.messageId);
    } catch (err) {
        console.error('Send failed: ' + err.message);
    }
}

testEmail();
