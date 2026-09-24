import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import axios from "axios";
import { sendOrderNotification, sendPaymentConfirmationEmail } from "@/lib/nodemailer";


function generateTxRef() {
  return `HC-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

const PRICE_MARKUPS: Record<string, number> = {
  customer: 1.3,
  professional: 1.2,
  wholesaler: 1.1,
  admin: 1.0,
  staff: 1.0,
};

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json();

    // ---------------- CONFIRM PAYMENT ----------------
    if (action === "confirm") {
      const { tx_ref: confirm_tx_ref, method } = body;
      if (!confirm_tx_ref) return NextResponse.json({ error: "tx_ref is required" }, { status: 400 });

      // Verification Logic
      let isVerified = false;

      if (method === 'monnify') {
        try {
          const apiKey = process.env.NEXT_PUBLIC_MONNIFY_API_KEY;
          const secretKey = process.env.MONNIFY_SECRET_KEY;
          
          if (apiKey && secretKey) {
            // Get Access Token
            const authRes = await axios.post("https://api.monnify.com/api/v1/auth/login", {}, {
              headers: {
                Authorization: `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`
              }
            });
            const token = authRes.data.responseBody.accessToken;

            // Verify Transaction
            const verifyRes = await axios.get(`https://api.monnify.com/api/v2/transactions/verify/${confirm_tx_ref}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (verifyRes.data.responseBody.paymentStatus === 'PAID') {
              const payment = await prisma.payment.findUnique({ where: { tx_ref: confirm_tx_ref } });
              const paidAmount = verifyRes.data.responseBody.amount;
              const expectedAmount = payment?.amount || 0;
              
              if (paidAmount >= expectedAmount) {
                isVerified = true;
              } else {
                console.error(`Amount mismatch: Paid ₦${paidAmount}, Expected ₦${expectedAmount}`);
                return NextResponse.json({ success: false, message: "Amount mismatch detected" });
              }
            }
          } else {
            // Fallback for dev if keys missing
            console.warn("Monnify keys missing, skipping server-side verification");
            isVerified = true; 
          }
        } catch (err) {
          console.error("Monnify verification error:", err);
          // Return failure if verification fails
          return NextResponse.json({ success: false, message: "Verification failed" });
        }
      } else if (method === 'flutterwave') {
        // Flutterwave verification would go here (requires FLW_SECRET_KEY)
        isVerified = true; // Placeholder
      } else if (method === 'manual_transfer') {
        const payment = await prisma.payment.findUnique({ where: { tx_ref: confirm_tx_ref } });
        if (payment) {
          await prisma.cart.update({
            where: { id: payment.cartId },
            data: { status: "unconfirmed" },
          });
          await prisma.payment.update({
            where: { tx_ref: confirm_tx_ref },
            data: { method: "manual_transfer" }
          });

          // Notify Admin
          const adminEmail = process.env.GOOGLE_EMAIL ?? 'adepojuololade2020@gmail.com';
          await sendOrderNotification(adminEmail, {
            status: "unconfirmed",
            tx_ref: confirm_tx_ref,
            amount: payment.amount,
            method: "Bank Transfer",
            payeeName: "Customer"
          });

          return NextResponse.json({ success: true, message: "Manual transfer noted" });
        }
      }

      if (isVerified) {
        const payment = await prisma.payment.findUnique({ 
          where: { tx_ref: confirm_tx_ref },
          include: { 
            cart: {
              include: {
                user: true,
                products: {
                  include: { product: true }
                }
              }
            }
          }
        });

        if (payment && payment.cart) {
          await prisma.cart.update({
            where: { id: payment.cartId },
            data: { status: "paid" },
          });
          await prisma.payment.update({
            where: { tx_ref: confirm_tx_ref },
            data: { method: method || "online" }
          });

          // Check for affiliate referral and credit commission
          if (payment.cart.affiliateId) {
            try {
              const affiliate = await prisma.affiliate.findUnique({
                where: { affiliateId: payment.cart.affiliateId },
              });

              if (affiliate) {
                const ownerCommission = payment.cart.total * 0.035;
                const userBonus = payment.cart.total * 0.015;

                await prisma.affiliate.update({
                  where: { id: affiliate.id },
                  data: { earnings: { increment: ownerCommission } },
                });

                await prisma.user.update({
                  where: { id: affiliate.userId },
                  data: { walletBalance: { increment: ownerCommission } },
                });

                await prisma.affiliateReferral.create({
                  data: {
                    affiliateIdFk: affiliate.id,
                    referredUserId: payment.cart.user?.id || null,
                    cartId: payment.cart.id,
                    orderId: payment.cart.id,
                    totalAmount: payment.cart.total,
                    affiliateCommission: ownerCommission,
                    referredBonus: userBonus,
                    status: 'paid',
                  },
                });

                await prisma.user.update({
                  where: { id: payment.cart.user.id },
                  data: { walletBalance: { increment: userBonus } },
                });

                console.log(`Affiliate commission credited: ₦${ownerCommission} to ${affiliate.affiliateId}, bonus ₦${userBonus} to buyer`);
              }
            } catch (commissionError) {
              console.error('Error crediting affiliate commission:', commissionError);
            }
          }

          // Send confirmation email to user
          if (payment.cart.user?.email) {
            await sendPaymentConfirmationEmail(payment.cart.user.email, {
              customerName: payment.cart.user.name || "Customer",
              contact: payment.cart.user.contact || "N/A",
              address: payment.cart.deliveryAddressId || "N/A", // Usually need to fetch address string, but using ID for now as fallback
              products: payment.cart.products,
              total: payment.cart.total,
              deliveryFee: payment.cart.deliveryFee || 0,
              orderId: payment.cart.id
            });
          }

          return NextResponse.json({ success: true, message: "Payment confirmed" });
        }
      }
      
      return NextResponse.json({ success: false, message: "Transaction not found or unverified" });
    }

    // ---------------- INITIATE CHECKOUT ----------------
    const { userId, items, cartId, deliveryFee = 0, deliveryAddressId, couponCode, discountAmount = 0, affiliateId } = body;

    if (!userId || !items?.length) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Server-side total calculation
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i: any) => i.productId) } },
      include: { bulkPrices: true }
    });

    const markup = PRICE_MARKUPS[user.role] || 1.3;
    
    let subtotal = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      let price = product.price;
      if (item.bulkPriceId) {
        const bulk = product.bulkPrices.find(b => b.id === item.bulkPriceId);
        if (bulk) price = bulk.price;
      } else if (item.isSpecial && item.customPrice) {
        price = item.customPrice;
      }
      
      subtotal += (Number(price) * Number(markup)) * Number(item.quantity);
    }

    const subtotalRounded = Math.ceil(subtotal / 5) * 5;
    const deliveryFeeRounded = Math.ceil(Number(deliveryFee) / 5) * 5;
    const discAmountRounded = Math.ceil(Number(discountAmount) / 5) * 5;

    let total = Math.max(0, (subtotalRounded - discAmountRounded) + deliveryFeeRounded);
    
    // Support for admin test payments
    if (user.role === 'admin' && body.forcedAmount) {
      total = Number(body.forcedAmount);
    }

    let cart;
    if (cartId) {
      // Re-initiate existing cart
      await prisma.cartItem.deleteMany({ where: { cartId } });
      cart = await prisma.cart.update({
        where: { id: cartId },
        data: {
          total,
          deliveryFee: Number(deliveryFee),
          deliveryAddressId,
          status: body.status || "pending",
          couponCode: couponCode || null,
          discountAmount: discAmountRounded,
          affiliateId: affiliateId || null,
          products: {
            create: items.map((i: any) => ({
              productId: i.productId,
              quantity: i.quantity,
              bulkPriceId: i.bulkPriceId,
              customName: i.customName,
              customPrice: i.customPrice,
              isSpecial: !!i.isSpecial,
            }))
          }
        }
      });
    } else {
      // Create new cart
      cart = await prisma.cart.create({
        data: {
          userId,
          total,
          deliveryFee: Number(deliveryFee),
          deliveryAddressId,
          status: body.status || "pending",
          couponCode: couponCode || null,
          discountAmount: discAmountRounded,
          affiliateId: affiliateId || null,
          products: {
            create: items.map((i: any) => ({
              productId: i.productId,
              quantity: i.quantity,
              bulkPriceId: i.bulkPriceId,
              customName: i.customName,
              customPrice: i.customPrice,
              isSpecial: !!i.isSpecial,
            }))
          }
        }
      });
    }

    const tx_ref = generateTxRef();
    await prisma.payment.upsert({
      where: { cartId: cart.id },
      update: {
        tx_ref,
        method: "online",
        amount: total,
      },
      create: {
        cartId: cart.id,
        tx_ref,
        method: "online",
        amount: total,
      }
    });

    return NextResponse.json({ cartId: cart.id, tx_ref, amount: total, currency: "NGN" });
  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: "Checkout initiation failed" }, { status: 500 });
  }
}
