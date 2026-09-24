"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Centralized model mapping
const modelMap: Record<string, any> = {
  cart: prisma.cart,
  cartItem: prisma.cartItem,
  category: prisma.category,
  coupon: prisma.coupon,
  featuredProduct: prisma.featuredProduct,
  notification: prisma.notification,
  payment: prisma.payment,
  post: prisma.post,
  product: prisma.product,
  refund: prisma.refund,
  review: prisma.review,
  shippingAddress: prisma.shippingAddress,
  stock: prisma.stock,
  user: prisma.user,
};

// =====================
// Cloudinary Upload
// =====================
async function handleUpload(file: File | string) {
  // Convert File to base64 if needed
  let dataURI = typeof file === "string" ? file : "";

  if (typeof file !== "string") {
    const buffer = await file.arrayBuffer();
    const b64 = Buffer.from(buffer).toString("base64");
    dataURI = `data:${file.type};base64,${b64}`;
  }

  const res = await cloudinary.v2.uploader.upload(dataURI, {
    resource_type: "auto",
  });

  return res;
}

// =====================
// DB Handler
// =====================
async function dbHandler({
  model,
  id,
  body,
  method,
  profileImage = false,
}: {
  model: string;
  id?: string;
  body?: any;
  method: "GET" | "POST" | "PUT" | "DELETE";
  profileImage?: boolean;
}) {
  const prismaModel = modelMap[model];
  if (!prismaModel) return { status: 400, data: { message: "Invalid model" } };

  try {
    switch (method) {
      case "GET":
        if (id) {
          const item = await prismaModel.findUnique({ where: { id } });
          if (!item) return { status: 404, data: { error: "Document not found" } };
          return { status: 200, data: item };
        } else {
          const items = await prismaModel.findMany();
          return { status: 200, data: items };
        }

      case "POST":
        if (body.price) body.price = parseFloat(body.price);
        if (body.url) body.images = [body.url]; // convert URL to images array
        const newItem = await prismaModel.create({ data: body });

        // Update profile image if required
        if (profileImage && model === "user" && body.userId && body.url) {
          await prisma.user.update({
            where: { id: body.userId },
            data: { avatarUrl: body.url },
          });
        }

        return { status: 200, data: newItem };

      case "PUT":
        const { id: _id, ...updatedData } = body;
        const updatedItem = await prismaModel.update({
          where: { id: _id },
          data: updatedData,
        });
        return { status: 200, data: updatedItem };

      case "DELETE":
        await prismaModel.delete({ where: { id } });
        return { status: 200, data: { success: true } };

      default:
        return { status: 405, data: { error: "Method not allowed" } };
    }
  } catch (error) {
    console.error("Database error:", error);
    return { status: 500, data: { error: "Failed to perform operation" } };
  }
}

// =====================
// API Route
// =====================
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  // Limit profile images to 300KB
  if (file && file.size > 300 * 1024 && formData.get("title") === "profile image") {
    return NextResponse.json({ error: "File size exceeds 300KB" }, { status: 413 });
  }

  let uploadRes;
  if (file) uploadRes = await handleUpload(file);

  const body = {
    description: formData.get("description"),
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    url: uploadRes?.url,
  };

  const result = await dbHandler({ model: "product", method: "POST", body });
  return NextResponse.json(result.data, { status: result.status });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const model = url.searchParams.get("model");
  const id = url.searchParams.get("id");

  if (!model) return NextResponse.json({ error: "Model required" }, { status: 400 });

  const result = await dbHandler({ model, method: "GET", id: id || undefined });
  return NextResponse.json(result.data, { status: result.status });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const result = await dbHandler({ model: body.model, method: "PUT", body });
  return NextResponse.json(result.data, { status: result.status });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const model = url.searchParams.get("model");
  const id = url.searchParams.get("id");

  if (!model || !id)
    return NextResponse.json({ error: "Model and ID required" }, { status: 400 });

  const result = await dbHandler({ model, method: "DELETE", id });
  return NextResponse.json(result.data, { status: result.status });
}
