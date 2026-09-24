// Use: node scripts/test-email.js
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('--- Email Configuration Test ---');
    const user = process.env.GMAIL || process.env.GOOGLE_EMAIL || 'adepojuololade2020@gmail.com';
    const pass = process.env.GOOGLE_APP_PASSWORD;
    const testRecipient = process.env.GOOGLE_EMAIL || 'ololadeadepoju2020@gmail.com';

    console.log('Account User:', user);
    console.log('App Password Status:', pass ? 'DEFINED' : 'MISSING');
    
    if (!pass) {
        console.error('ERROR: GOOGLE_APP_PASSWORD is not set in environment.');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });

    try {
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('SMTP Connection: SUCCESS');

        console.log(`Sending test email to ${testRecipient}...`);
        const info = await transporter.sendMail({
            from: `"HealthClique Test" <${user}>`,
            to: testRecipient,
            subject: "HealthClique Email Test Successful ✅",
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #10b981;">Email System Operational</h1>
                    <p>This is a test email from <strong>HealthClique</strong> backend.</p>
                    <hr/>
                    <p style="font-size: 12px; color: #666;">Timestamp: ${new Date().toLocaleString()}</p>
                </div>
            `
        });

        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (err) {
        console.error('FAILED to send email:');
        console.error(err);
    }
}

testEmail();
