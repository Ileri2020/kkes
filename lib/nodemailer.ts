import nodemailer from 'nodemailer';

const email = process.env.GOOGLE_EMAIL ?? 'healthcliquespecialties@gmail.com';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD, 
    },
});

export const sendOrderNotification = async (to: string, orderDetails: any) => {
    try {
        console.log('Sending order notification email to:', to);
        const isUnconfirmed = orderDetails.status === 'unconfirmed';
        const subject = isUnconfirmed ? '[HEALTHCLIQUE] Action Required: Confirm Bank Transfer' : '[HEALTHCLIQUE] New Order Notification';
        
        const mailOptions = {
            from: `"HealthClique" <${email}>`,
            to,
            subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background: #4f46e5; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">${subject}</h1>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #374151;">${isUnconfirmed ? 'A bank transfer checkout has been submitted and is awaiting confirmation.' : 'A new order has been successfully placed on HealthClique.'}</p>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="margin-top: 0; color: #111827; font-size: 18px;">Transaction Summary</h3>
                    <p style="margin: 8px 0;"><strong>Reference:</strong> ${orderDetails.tx_ref}</p>
                    <p style="margin: 8px 0;"><strong>Total Amount:</strong> ₦${(orderDetails.amount || 0).toLocaleString()}</p>
                    <p style="margin: 8px 0;"><strong>Method:</strong> ${orderDetails.method || 'Online'}</p>
                    ${orderDetails.payeeName ? `<p style="margin: 8px 0;"><strong>Payee Name:</strong> ${orderDetails.payeeName}</p>` : ''}
                    ${orderDetails.receiptUrl ? `<p style="margin: 8px 0; margin-top: 15px;"><strong>Payment Proof:</strong> <a href="${orderDetails.receiptUrl}" style="color: #4f46e5; text-decoration: underline;">View Uploaded Receipt</a></p>` : ''}
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                    Date: ${new Date().toLocaleString()}<br>
                    Order Status: <span style="text-transform: uppercase; font-weight: bold; color: ${isUnconfirmed ? '#f59e0b' : '#10b981'};">${orderDetails.status}</span>
                </p>
            </div>
            <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
                © 2026 HealthClique Pharmacy. All rights reserved.
            </div>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Order notification email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending order notification email:', error);
        return null;
    }
};

export const sendPaymentConfirmationEmail = async (to: string, data: {
    customerName: string;
    contact: string;
    address: string;
    products: any[];
    total: number;
    deliveryFee: number;
    orderId: string;
}) => {
    try {
        console.log('Sending payment confirmation email to:', to);
        const productRows = data.products.map((item: any) => {
            const p = item.product || item;
            return `
            <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151;">
                    ${p.name} ${item.bulkName ? `<br><span style="font-size: 11px; color: #4f46e5; font-weight: bold;">(${item.bulkName})</span>` : ''}
                </td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #6b7280;">${item.quantity}</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: bold; color: #111827;">₦${(item.price || p.price || 0).toLocaleString()}</td>
            </tr>
        `;}).join('');

        const mailOptions = {
            from: `"HealthClique" <${email}>`,
            to,
            subject: `HealthClique: Order Confirmation - #${data.orderId.slice(-6).toUpperCase()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <div style="background: #10b981; padding: 25px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">Order Confirmed!</h1>
                        <p style="margin: 5px 0 0; opacity: 0.9;">Thank you for your purchase</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; color: #374151;">Hi ${data.customerName},</p>
                        <p style="font-size: 16px; color: #374151; line-height: 1.5;">Your payment has been successfully confirmed. We are currently preparing your items for delivery.</p>
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px dashed #d1d5db;">
                            <h3 style="margin-top: 0; color: #111827; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Delivery Information</h3>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Order ID:</strong> #${data.orderId.toUpperCase()}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Address:</strong> ${data.address}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Contact:</strong> ${data.contact}</p>
                        </div>

                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                            <thead>
                                <tr style="text-align: left; background: #f3f4f6;">
                                    <th style="padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #6b7280;">Product</th>
                                    <th style="padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #6b7280; text-align: center;">Qty</th>
                                    <th style="padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #6b7280; text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productRows}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="padding: 15px 8px 5px; text-align: right; font-size: 14px; color: #6b7280;">Subtotal:</td>
                                    <td style="padding: 15px 8px 5px; text-align: right; font-size: 14px; font-weight: bold; color: #111827;">₦${(data.total - data.deliveryFee).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 5px 8px; text-align: right; font-size: 14px; color: #6b7280;">Delivery Fee:</td>
                                    <td style="padding: 5px 8px; text-align: right; font-size: 14px; font-weight: bold; color: #111827;">₦${data.deliveryFee.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 15px 8px; text-align: right; font-size: 18px; font-weight: bold; color: #111827;">Total:</td>
                                    <td style="padding: 15px 8px; text-align: right; font-size: 18px; font-weight: bold; color: #10b981;">₦${data.total.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div style="text-align: center; margin-top: 40px;">
                            <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact our support team.</p>
                            <p style="font-weight: bold; color: #10b981; font-size: 16px;">Healthy Living, Better Life!</p>
                        </div>
                    </div>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                        HealthClique Pharmacy & Healthcare Services<br>
                        © 2026 HealthClique. All rights reserved.
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Payment confirmation email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
        return null;
    }
};

export const sendAdminCustomEmail = async (to: string, data: {
    customerName: string;
    message: string;
    cartId: string;
    tx_ref: string;
    products: any[];
    total: number;
}) => {
    try {
        console.log('Sending admin custom email to:', to);
        const productRows = data.products.map((p: any) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px 8px; font-size: 14px; color: #374151;">${p.product?.name || p.customName}</td>
                <td style="padding: 12px 8px; font-size: 14px; text-align: center; color: #6b7280;">${p.quantity}</td>
                <td style="padding: 12px 8px; font-size: 14px; text-align: right; font-weight: bold; color: #111827;">₦${(p.customPrice || p.product?.price || 0).toLocaleString()}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: email,
            to,
            subject: `Update on your Order #${data.cartId}`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f7fa; padding: 40px 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                        
                        <div style="background: #10b981; padding: 32px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">HEALTHCLIQUE</h1>
                            <p style="color: rgba(255,255,255,0.9); margin-top: 4px; font-size: 14px; font-weight: 500;">Status Update Notification</p>
                        </div>

                        <div style="padding: 32px;">
                            <p style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 24px;">Hi ${data.customerName},</p>
                            
                            <div style="background: #fef2f2; border-radius: 12px; padding: 24px; border-left: 5px solid #ef4444; margin-bottom: 32px;">
                                <p style="margin: 0; color: #dc2626; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px;">Message from Support</p>
                                <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600; line-height: 1.6;">${data.message}</p>
                            </div>

                            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                                <div style="display: inline-block; width: 48%; margin-right: 2%;">
                                    <p style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 800; margin: 0;">Order Ref</p>
                                    <p style="font-size: 13px; color: #111827; font-weight: 700; margin-top: 2px; font-family: monospace;">${data.tx_ref}</p>
                                </div>
                                <div style="display: inline-block; width: 48%;">
                                    <p style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 800; margin: 0;">Cart ID</p>
                                    <p style="font-size: 13px; color: #111827; font-weight: 700; margin-top: 2px;">#${data.cartId}</p>
                                </div>
                            </div>

                            <h3 style="font-size: 16px; font-weight: 800; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; margin-top: 0; margin-bottom: 16px;">Order Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding: 0 8px 8px 8px; font-size: 11px; font-weight: 900; color: #9ca3af; text-transform: uppercase;">Product</th>
                                        <th style="text-align: center; padding: 0 8px 8px 8px; font-size: 11px; font-weight: 900; color: #9ca3af; text-transform: uppercase;">Qty</th>
                                        <th style="text-align: right; padding: 0 8px 8px 8px; font-size: 11px; font-weight: 900; color: #9ca3af; text-transform: uppercase;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productRows}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="2" style="padding-top: 24px; text-align: right; font-weight: 800; font-size: 14px; color: #4b5563;">Final Total:</td>
                                        <td style="padding-top: 24px; text-align: right; font-weight: 900; font-size: 20px; color: #10b981;">₦${data.total.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #f3f4f6; text-align: center;">
                                <p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">
                                    This is a system-generated message. Please do not reply directly to this email.
                                </p>
                                <p style="font-size: 14px; font-weight: 800; color: #10b981;">© 2026 HEALTHCLIQUE PHARMA LTD</p>
                            </div>
                        </div>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Admin custom email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending admin custom email:', error);
        return null;
    }
};
