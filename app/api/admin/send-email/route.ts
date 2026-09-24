import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminCustomEmail } from "@/lib/nodemailer";


export async function POST(req: NextRequest) {
  try {
    const { cartId, message } = await req.json();

    if (!cartId || !message) {
      return NextResponse.json({ error: "Cart ID and message are required" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        user: true,
        products: {
          include: { product: true }
        },
        payment: true
      }
    });

    if (!cart || !cart.user?.email) {
      return NextResponse.json({ error: "Cart or user email not found" }, { status: 404 });
    }

    const result = await sendAdminCustomEmail(cart.user.email, {
      customerName: cart.user.name || "Customer",
      message: message,
      cartId: cart.id,
      tx_ref: cart.payment?.tx_ref || "N/A",
      products: cart.products,
      total: cart.total
    });

    if (result) {
      return NextResponse.json({ success: true, message: "Email sent successfully" });
    } else {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }
  } catch (error) {
    console.error("Admin Email API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
