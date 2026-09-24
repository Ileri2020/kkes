"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import { auth } from "@/auth";
import type { Session } from "next-auth";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PRICE_MARKUPS: Record<string, number> = {
  customer: 1.3,
  professional: 1.2,
  wholesaler: 1.1,
  admin: 1.1,
  staff: 1.1,
  visitor: 1.3,
  user: 1.3,
};

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
  message: prisma.message,
  brand: prisma.brand,
  activeIngredient: prisma.activeIngredient,
  healthConcern: prisma.healthConcern,
  bulkPrice: prisma.bulkPrice,
  // @ts-ignore
  priceFeedback: prisma.priceFeedback,
  deliveryFee: prisma.deliveryFee,
};

// =====================
// Utilities
// =====================
function parseId(id: string | null, model: string) {
  if (!id) return null;
  return [
    "user", "category", "product", "brand", "school", "schoolUser", "schoolClass",
    "subject", "topic", "media", "mediaType", "question", "questionOption", "test",
    "testQuestion", "assessmentAttempt", "attemptAnswer", "assignment", "assignmentSubmission",
    "studyGroup", "studyGroupMember", "chatThread", "chatMessage", "announcement", "schoolFee",
    "complaint", "dailyProgress", "performanceMetric", "rankingSnapshot", "alumniProfile", "auditLog",
  ].includes(model) ? id : Number(id);
}

const schoolModels = new Set([
  "school", "schoolUser", "schoolClass", "subject", "topic", "media", "mediaType", "question",
  "questionOption", "test", "testQuestion", "assessmentAttempt", "attemptAnswer", "assignment",
  "assignmentSubmission", "studyGroup", "studyGroupMember", "chatThread", "chatMessage",
  "announcement", "schoolFee", "complaint", "dailyProgress", "performanceMetric", "rankingSnapshot",
  "alumniProfile", "auditLog",
]);

async function getSchoolScope(session: Session | null | undefined) {
  const userId = session?.user?.id;
  if (!userId) return null;
  const membership = await prisma.schoolUser.findFirst({
    where: { userId, status: "ACTIVE" },
    select: { id: true, schoolId: true, classId: true, role: true },
  });
  return membership ? { userId, ...membership } : null;
}

async function handleSchoolGet(model: string, id: string | null, req: NextRequest) {
  const session = await auth();
  const scope = await getSchoolScope(session);
  if (!scope) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);
  const userOnly = { userId: scope.userId };
  const schoolOnly = { schoolId: scope.schoolId };

  switch (model) {
    case "school":
      return prisma.school.findUnique({ where: { id: id ?? scope.schoolId } });
    case "schoolUser":
      return prisma.schoolUser.findMany({ where: { schoolId: scope.schoolId, ...(id ? { id } : { userId: scope.userId }) }, include: { class: true }, take: limit, skip: offset });
    case "dailyProgress":
      return prisma.dailyProgress.findMany({ where: userOnly, orderBy: { date: "desc" }, take: limit, skip: offset });
    case "performanceMetric":
      return prisma.performanceMetric.findMany({ where: { ...userOnly, ...schoolOnly }, orderBy: { recordedAt: "desc" }, take: limit, skip: offset });
    case "rankingSnapshot":
      return prisma.rankingSnapshot.findMany({ where: { ...userOnly, ...schoolOnly }, orderBy: { createdAt: "desc" }, take: limit, skip: offset });
    case "test":
      return id
        ? prisma.test.findFirst({ where: { id, ...schoolOnly, isPublished: true }, include: { topic: true, class: true, questions: { include: { question: { include: { options: true, topic: true } } } } } })
        : prisma.test.findMany({ where: { ...schoolOnly, isPublished: true }, orderBy: { startsAt: "asc" }, take: limit, skip: offset, include: { topic: true, class: true } });
    case "assignment":
      return id
        ? prisma.assignment.findFirst({ where: { id, ...schoolOnly, OR: [{ classId: null }, { classId: scope.classId ?? "" }] }, include: { submissions: { where: { studentId: scope.userId } } } })
        : prisma.assignment.findMany({ where: { ...schoolOnly, OR: [{ classId: null }, { classId: scope.classId ?? "" }] }, orderBy: { dueDate: "asc" }, take: limit, skip: offset, include: { submissions: { where: { studentId: scope.userId } } } });
    case "announcement":
      return prisma.announcement.findMany({ where: schoolOnly, orderBy: { createdAt: "desc" }, take: limit, skip: offset });
    case "media":
      return prisma.media.findMany({ where: { ...schoolOnly, isPublic: true }, orderBy: { createdAt: "desc" }, take: limit, skip: offset, include: { topic: true, mediaType: true } });
    case "subject":
      return prisma.subject.findMany({ where: schoolOnly, orderBy: { name: "asc" }, take: limit, skip: offset, include: { topics: true } });
    case "topic":
      return prisma.topic.findMany({ where: { subject: { schoolId: scope.schoolId } }, orderBy: { name: "asc" }, take: limit, skip: offset, include: { subject: true } });
    case "question": {
      const topicId = searchParams.get("topicId");
      const subjectId = searchParams.get("subjectId");
      const difficulty = searchParams.get("difficulty");
      const type = searchParams.get("type");
      return prisma.question.findMany({
        where: {
          ...(topicId ? { topicId } : {}),
          ...(difficulty ? { difficulty: difficulty as any } : {}),
          ...(type ? { type: type as any } : {}),
          topic: { subject: { schoolId: scope.schoolId, ...(subjectId ? { id: subjectId } : {}) } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: { topic: { include: { subject: true } }, options: { orderBy: { label: "asc" } } },
      });
    }
    case "assessmentAttempt":
      return prisma.assessmentAttempt.findMany({ where: { studentId: scope.id }, orderBy: { startedAt: "desc" }, take: limit, skip: offset, include: { test: true, answers: true } });
    case "attemptAnswer":
      return prisma.attemptAnswer.findMany({ where: { attempt: { studentId: scope.id } }, orderBy: { createdAt: "desc" }, take: limit, skip: offset, include: { question: { include: { topic: { include: { subject: true } } } } } });
    case "studyGroup":
      return prisma.studyGroup.findMany({ where: schoolOnly, orderBy: { createdAt: "desc" }, take: limit, skip: offset, include: { members: { where: { userId: scope.userId } } } });
    case "chatThread":
      return prisma.chatThread.findMany({ where: { ...schoolOnly, messages: { some: { OR: [{ senderId: scope.userId }, { receiverId: scope.userId }] } } }, orderBy: { updatedAt: "desc" }, take: limit, skip: offset, include: { messages: { where: { OR: [{ senderId: scope.userId }, { receiverId: scope.userId }] }, orderBy: { createdAt: "asc" }, take: 50 } } });
    case "chatMessage":
      return prisma.chatMessage.findMany({ where: { OR: [{ senderId: scope.userId }, { receiverId: scope.userId }] }, orderBy: { createdAt: "desc" }, take: limit, skip: offset, include: { thread: true } });
    case "complaint":
      return prisma.complaint.findMany({ where: userOnly, orderBy: { createdAt: "desc" }, take: limit, skip: offset });
    default:
      return NextResponse.json({ error: `School model ${model} is not available for this operation` }, { status: 400 });
  }
}

async function handleUpload(file: File | string) {
  let dataURI = typeof file === "string" ? file : "";
  if (typeof file !== "string") {
    const buffer = await file.arrayBuffer();
    const b64 = Buffer.from(buffer).toString("base64");
    dataURI = `data:${file.type};base64,${b64}`;
  }
  return await cloudinary.v2.uploader.upload(dataURI, { resource_type: "auto" });
}

// ==================== GET ====================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  const id = parseId(searchParams.get("id"), model || "");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const minimal = searchParams.get("minimal") === "true";

  if (model && schoolModels.has(model)) {
    try {
      const result = await handleSchoolGet(model, searchParams.get("id"), req);
      return NextResponse.json(result);
    } catch (error) {
      console.error("School dbhandler GET error:", error);
      return NextResponse.json({ error: "Failed to fetch school data" }, { status: 500 });
    }
  }

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

  const prismaModel = modelMap[model];

  try {
    if (!id) {
      if (model === "featuredProduct") {
        return NextResponse.json(await prisma.featuredProduct.findMany({
          take: limit,
          skip: offset,
          include: { 
            product: { 
              include: { 
                category: true, 
                stock: !minimal, 
                reviews: false // Never load reviews for lists
              } 
            } 
          },
        }));
      }

      if (model === "review" || model === "post") {
        return NextResponse.json(await prismaModel.findMany({
          take: limit,
          skip: offset,
          include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' }
        }));
      }

      if (model === "category") {
        return NextResponse.json(await prisma.category.findMany({
          take: limit,
          skip: offset,
          include: { 
            products: { take: 3, select: { images: true } },
            _count: { select: { products: true } }
          }
        }));
      }

      if (model === "product") {
        const brand = searchParams.get("brand");
        const categoryId = searchParams.get("categoryId");
        const categoryName = searchParams.get("categoryName");
        const concern = searchParams.get("concern");
        const includeParams = searchParams.get("include")?.split(",");
        
        const where: any = {};
        if (brand) where.brand = { name: { equals: brand.trim(), mode: 'insensitive' } };
        if (categoryId) where.categoryId = categoryId;
        if (categoryName) where.category = { name: { equals: categoryName.trim(), mode: 'insensitive' } };
        if (concern) where.category = { name: { equals: concern.trim(), mode: 'insensitive' } };

        const searchQuery = searchParams.get("query")?.trim();
        if (searchQuery) {
          where.OR = [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { brand: { name: { contains: searchQuery, mode: 'insensitive' } } },
            { category: { name: { contains: searchQuery, mode: 'insensitive' } } },
            { activeIngredients: { some: { name: { contains: searchQuery, mode: 'insensitive' } } } },
          ];
        }

        if (searchParams.get("requireImages") === "true") {
          where.images = { isEmpty: false };
        }
        if (searchParams.get("requirePrice") === "true") {
          where.price = { gt: 0 };
        }

        const include: any = {};
        if (includeParams) {
          includeParams.forEach(inc => { if (inc !== 'reviews') include[inc] = true; });
        } else if (!minimal) {
          include.category = true;
          include.stock = true;
          include.brand = true;
          include.activeIngredients = true;
          include.healthConcerns = true;
          include.bulkPrices = true;
        } else {
          include.category = true;
        }

        const query = {
          where,
          include: Object.keys(include).length > 0 ? include : undefined,
          take: Math.min(limit, 5000), // Cap product fetch to 5000
          skip: offset,
          orderBy: { createdAt: 'desc' as const }
        };

        if (searchParams.get("pagination") === "true") {
          const [data, total] = await Promise.all([
            prisma.product.findMany(query),
            prisma.product.count({ where })
          ]);
          return NextResponse.json({ data, total });
        }

        return NextResponse.json(await prisma.product.findMany(query));
      }

      if (model === "category") {
        return NextResponse.json(await prisma.category.findMany({
          take: limit,
          include: { _count: { select: { products: true } } },
          orderBy: { name: 'asc' }
        }));
      }

      if (model === "brand") {
        return NextResponse.json(await prisma.brand.findMany({
          take: limit,
          include: { _count: { select: { products: true } } },
          orderBy: { order: 'asc' }
        }));
      }

      if (model === "activeIngredient") {
        return NextResponse.json(await prisma.activeIngredient.findMany({
          take: limit,
          include: { _count: { select: { products: true } } },
          orderBy: { name: 'asc' }
        }));
      }

      if (model === "healthConcern") {
        return NextResponse.json(await prisma.healthConcern.findMany({
          take: limit,
          include: { _count: { select: { products: true } } },
          orderBy: { name: 'asc' }
        }));
      }

      if (model === "bulkPrice") {
        return NextResponse.json(await prisma.bulkPrice.findMany({
          take: limit,
          include: { product: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }));
      }

      const userId = searchParams.get("userId");
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const status = searchParams.get("status"); // CSV support
      const where: any = {};

      if (userId) where.userId = userId;
      if (model === "coupon" && code) where.code = code;
      if (model === "deliveryFee" && state) where.state = state;
      
      if (model === "cart" && status) {
          where.status = { in: status.split(",").map(s => s.trim()) };
      }

      if (model === "cart") {
          return NextResponse.json(await prisma.cart.findMany({
              where,
              include: {
                  user: { select: { id: true, email: true, name: true, contact: true } },
                  products: { include: { product: true } },
                  payment: true
              },
              take: limit,
              skip: offset,
              orderBy: { createdAt: 'desc' }
          }));
      }

      return NextResponse.json(await prismaModel.findMany({ 
        where, 
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }));
    } else {
      // Single item fetch
      const include: any = {};
      if (model === "product") {
        include.category = true;
        include.stock = true;
        include.brand = true;
        include.activeIngredients = true;
        include.healthConcerns = true;
        include.bulkPrices = true;
        include.reviews = { include: { user: { select: { name: true, avatarUrl: true } } } };
      }

      if (model === "cart") {
          include.user = { select: { id: true, email: true, name: true, contact: true, addresses: true } };
          include.products = { include: { product: true } };
          include.payment = true;
      }
      
      const item = await prismaModel.findUnique({ 
        where: { id },
        include: Object.keys(include).length > 0 ? include : undefined
      });
      if (!item) return NextResponse.json({ error: "Document not found" }, { status: 404 });
      return NextResponse.json(item);
    }
  } catch (error) {
    console.error("Database GET error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

// ==================== POST ====================
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");

  if (model === "complaint" || model === "studyGroupMember" || model === "chatMessage") {
    const session = await auth();
    const scope = await getSchoolScope(session);
    if (!scope) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const body = await req.json();

    try {
      if (model === "complaint") {
        const category = ["COMPLAIN", "ADVICE", "FEEDBACK"].includes(body.category) ? body.category : "FEEDBACK";
        const complaint = await prisma.complaint.create({
          data: {
            schoolId: scope.schoolId,
            userId: scope.userId,
            category,
            title: String(body.title ?? "").trim(),
            message: String(body.message ?? "").trim(),
          },
        });
        return NextResponse.json(complaint, { status: 201 });
      }

      if (model === "chatMessage") {
        const thread = await prisma.chatThread.findFirst({ where: { id: String(body.threadId ?? ""), schoolId: scope.schoolId } });
        if (!thread || !String(body.content ?? "").trim()) return NextResponse.json({ error: "Invalid conversation or message" }, { status: 400 });
        const message = await prisma.chatMessage.create({ data: { threadId: thread.id, senderId: scope.userId, receiverId: body.receiverId ? String(body.receiverId) : undefined, content: String(body.content).trim() } });
        return NextResponse.json(message, { status: 201 });
      }

      const group = await prisma.studyGroup.findFirst({ where: { id: String(body.groupId ?? ""), schoolId: scope.schoolId } });
      if (!group) return NextResponse.json({ error: "Study group not found" }, { status: 404 });
      const membership = await prisma.studyGroupMember.create({
        data: { groupId: group.id, userId: scope.userId, role: "member" },
      });
      return NextResponse.json(membership, { status: 201 });
    } catch (error) {
      console.error("School dbhandler POST error:", error);
      return NextResponse.json({ error: "Request could not be completed" }, { status: 400 });
    }
  }

  const session = await auth();
  const role = (session?.user as any)?.role || "visitor";

  const protectedModels = ["product", "category", "featuredProduct", "stock", "coupon", "brand", "post"];
  if (protectedModels.includes(model || "") && role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

  const prismaModel = modelMap[model];
  const contentType = req.headers.get("content-type") || "";
  let body: any = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    if (files.length > 0) {
      const urls: string[] = [];
      for (const file of files) {
        const uploadRes = await handleUpload(file);
        urls.push(uploadRes.url);
      }
      if (model === "product") body.images = urls;
      if (model === "user") body.avatarUrl = urls[0];
      if (model === "category") body.image = urls[0];
      if (model === "post") body.contentUrl = urls[0];
    }
    formData.forEach((value, key) => { if (key !== "file") body[key] = value; });
  } else {
    body = await req.json();
  }

  try {
    if (model === "cart") {
      const { userId, products, status } = body;
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: products.map((p: any) => p.productId).filter(Boolean) } },
        select: { id: true, price: true, bulkPrices: true },
      });

      let total = 0;
      let userRole = "customer";
      if (userId && userId !== "nil") {
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (dbUser) userRole = dbUser.role;
      }
      const markup = PRICE_MARKUPS[userRole] || 1.3;

      products.forEach((item: any) => {
        if (item.productId?.startsWith("special-")) {
            total += (item.customPrice || 0) * item.quantity;
            return;
        }
        
        const found = dbProducts.find((p) => p.id === item.productId);
        if (found) {
            let itemPrice = found.price;
            if (item.bulkPriceId) {
                const bulk = found.bulkPrices.find(b => b.id === item.bulkPriceId);
                if (bulk) itemPrice = bulk.price;
            }
            total += (itemPrice * markup) * item.quantity;
        }
      });

      return NextResponse.json(await prisma.cart.create({
        data: {
          userId,
          total,
          status: status || "pending",
          products: { 
            create: products.map((p: any) => ({ 
              productId: p.productId && !p.productId.startsWith('special-') ? p.productId : null, 
              quantity: p.quantity,
              customName: p.customName || (p.productId?.startsWith('special-') ? p.name : null),
              customPrice: p.customPrice,
              bulkPriceId: p.bulkPriceId,
              isSpecial: !!p.isSpecial || p.productId?.startsWith('special-')
            })) 
          },
        },
        include: { products: true },
      }));
    }

    if (model === "user" && body.password) {
      body.password = await bcrypt.hash(body.password, await bcrypt.genSalt());
    }

    // Parsing
    if (body.price) body.price = parseFloat(body.price);
    ['requiresPrescription', 'scarce', 'isRead'].forEach(field => {
       if (body[field] === "true") body[field] = true;
       if (body[field] === "false") body[field] = false;
    });

    if (model === "product") {
      if (body.brand) {
        body.brand = { connectOrCreate: { where: { name: body.brand }, create: { name: body.brand } } };
      } else {
        delete body.brand;
      }
      if (Array.isArray(body.activeIngredients)) {
        body.activeIngredients = { connectOrCreate: body.activeIngredients.map((name: string) => ({ where: { name }, create: { name } })) };
      }
      if (Array.isArray(body.healthConcerns)) {
        body.healthConcerns = { connectOrCreate: body.healthConcerns.map((name: string) => ({ where: { name }, create: { name } })) };
      }
      if (Array.isArray(body.bulkPrices)) {
        body.bulkPrices = {
          create: body.bulkPrices.map((bp: any) => ({
            name: bp.name,
            quantity: parseInt(bp.quantity),
            price: parseFloat(bp.price)
          }))
        };
      }
    }

    return NextResponse.json(await prismaModel.create({ data: body }));
  } catch (error) {
    console.error("Database POST error:", error);
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}

// ==================== PUT ====================
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  const session = await auth();
  const role = (session?.user as any)?.role || "visitor";

  if (model !== "user" && role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

  const prismaModel = modelMap[model];
  const contentType = req.headers.get("content-type") || "";
  let body: any = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (file) {
      const uploadRes = await handleUpload(file);
      if (model === "category") body.image = uploadRes.url;
      if (model === "user") body.avatarUrl = uploadRes.url;
      if (model === "product") body.images = [uploadRes.url];
    }
    formData.forEach((value, key) => { if (key !== "file") body[key] = value; });
  } else {
    body = await req.json();
  }

  // Support for bulk brand reordering
  if (model === "brand" && Array.isArray(body)) {
    try {
      const updates = body.map((item: any) => 
        prisma.brand.update({
          where: { id: item.id },
          data: { order: parseInt(item.order) || 0 }
        })
      );
      await prisma.$transaction(updates);
      return NextResponse.json({ success: true, count: updates.length });
    } catch (error) {
      console.error("Bulk update error:", error);
      return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
    }
  }

  const id = parseId(body.id || searchParams.get("id"), model);
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const { id: _, ...updatedData } = body;
  
  if (updatedData.isRead === "true") updatedData.isRead = true;
  if (updatedData.isRead === "false") updatedData.isRead = false;

  if (model === "product") {
    if (updatedData.brand !== undefined) {
      if (updatedData.brand) {
        updatedData.brand = { connectOrCreate: { where: { name: updatedData.brand }, create: { name: updatedData.brand } } };
      } else {
        updatedData.brand = { disconnect: true };
      }
    }
    if (updatedData.category !== undefined || updatedData.categoryId !== undefined) {
      const categoryValue = updatedData.category || updatedData.categoryId;
      if (categoryValue) {
        // If it's already an ID (ObjectId), connect directly
        if (typeof categoryValue === 'string' && categoryValue.match(/^[0-9a-fA-F]{24}$/)) {
          updatedData.category = { connect: { id: categoryValue } };
        } else {
          // Otherwise treat as name and connectOrCreate
          updatedData.category = { connectOrCreate: { where: { name: categoryValue }, create: { name: categoryValue } } };
        }
      } else {
        updatedData.category = { disconnect: true };
      }
      // Remove categoryId to avoid conflicts
      delete updatedData.categoryId;
    }
    if (updatedData.images !== undefined) {
      if (Array.isArray(updatedData.images)) {
        updatedData.images = updatedData.images.map((item: any) => String(item).trim()).filter(Boolean);
      } else if (typeof updatedData.images === 'string') {
        updatedData.images = updatedData.images.trim() ? [updatedData.images.trim()] : [];
      } else {
        delete updatedData.images;
      }
    }
    if (Array.isArray(updatedData.activeIngredients)) {
      updatedData.activeIngredients = { set: [], connectOrCreate: updatedData.activeIngredients.map((name: string) => ({ where: { name }, create: { name } })) };
    }
    if (Array.isArray(updatedData.healthConcerns)) {
      updatedData.healthConcerns = { set: [], connectOrCreate: updatedData.healthConcerns.map((name: string) => ({ where: { name }, create: { name } })) };
    }
    if (Array.isArray(updatedData.bulkPrices)) {
      updatedData.bulkPrices = {
        deleteMany: {},
        create: updatedData.bulkPrices.map((bp: any) => ({
          name: bp.name,
          quantity: parseInt(bp.quantity),
          price: parseFloat(bp.price)
        }))
      };
    }
  }
  try {
    return NextResponse.json(await prismaModel.update({
      where: { id: String(id) },
      data: updatedData,
    }));
  } catch (error) {
    console.error("Database PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ==================== DELETE ====================
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  const id = parseId(searchParams.get("id"), model || "");

  if (model === "studyGroupMember") {
    const session = await auth();
    const scope = await getSchoolScope(session);
    if (!scope) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    try {
      await prisma.studyGroupMember.deleteMany({ where: { id: String(id), userId: scope.userId } });
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: "Could not leave study group" }, { status: 400 });
    }
  }

  const session = await auth();
  const role = (session?.user as any)?.role || "visitor";

  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!model || !modelMap[model] || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    await modelMap[model].delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
