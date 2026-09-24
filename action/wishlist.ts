"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function toggleWishlist(productId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    const existing = await prisma.wishlist.findUnique({
        where: {
            userId_productId: {
                userId,
                productId,
            },
        },
    });

    if (existing) {
        await prisma.wishlist.delete({
            where: {
                id: existing.id,
            },
        });
        revalidatePath("/");
        return { added: false };
    } else {
        await prisma.wishlist.create({
            data: {
                userId,
                productId,
            },
        });
        revalidatePath("/");
        return { added: true };
    }
}

export async function checkWishlisStatus(productId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return false;
    }
    const userId = session.user.id;
    const existing = await prisma.wishlist.findUnique({
        where: {
            userId_productId: {
                userId,
                productId,
            },
        },
    });
    return !!existing;
}

export async function getUserWishlist() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }
    const userId = session.user.id;
    const items = await prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true }
    });
    return items.map(i => i.productId);
}
