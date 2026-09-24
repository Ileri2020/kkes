// Use: node scripts/send-real-order-email.js
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

async function testRealCustomerEmail() {
    console.log('--- Real Customer Email Test ---');
    
    try {
        // Find a recent order for ANY user
        const order = await prisma.cart.findFirst({
            where: {
                status: 'paid'
            },
            include: {
                user: true,
                products: { include: { product: true } },
                payment: true
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!order || !order.user?.email) {
            console.warn('No recent customer checkouts found to test with.');
            return;
        }

        console.log(`Found recent customer order for: ${order.user.name} (${order.user.email})`);
        console.log(`Cart ID: ${order.id}`);

        // Set up transporter
        const userEmail = process.env.GMAIL || process.env.GOOGLE_EMAIL || 'adepojuololade2020@gmail.com';
        const pass = process.env.GOOGLE_APP_PASSWORD;

        if (!pass) {
            console.error('ERROR: GOOGLE_APP_PASSWORD is not set.');
            return;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: userEmail, pass }
        });

        console.log('Sending real notification simulation...');
        
        const mailOptions = {
            from: `"HealthClique Support" <${userEmail}>`,
            to: order.user.email,
            subject: `Update on Order #${order.id.slice(-6).toUpperCase()}`,
            html: `
                <div style="font-family: Arial; padding: 20px;">
                    <h2>Hello ${order.user.name},</h2>
                    <p>This is a manual test notification regarding your order at HealthClique.</p>
                    <p><strong>Total Paid:</strong> ₦${order.total.toLocaleString()}</p>
                    <p><strong>Items:</strong></p>
                    <ul>
                        ${order.products.map(p => `<li>${p.product?.name || p.customName} x ${p.quantity}</li>`).join('')}
                    </ul>
                    <hr/>
                    <p>Thank you for your patience!</p>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Notification sent successfully:', result.messageId);

    } catch (err) {
        console.error('Failed to send real customer email:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testRealCustomerEmail();
