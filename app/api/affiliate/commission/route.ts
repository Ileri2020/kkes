import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { affiliateId, amount, orderId, cartId } = await request.json();

    if (!affiliateId || !amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: affiliateId, amount, orderId' },
        { status: 400 }
      );
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { affiliateId },
      include: { user: true },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const ownerCommission = Number(amount) * 0.035;
    const customerBonus = Number(amount) * 0.015;

    const updatedAffiliate = await prisma.affiliate.update({
      where: { affiliateId },
      data: {
        earnings: {
          increment: ownerCommission,
        },
      },
    });

    await prisma.user.update({
      where: { id: affiliate.userId },
      data: {
        walletBalance: {
          increment: ownerCommission,
        },
      },
    });

    await prisma.affiliateReferral.create({
      data: {
        affiliateIdFk: affiliate.id,
        referredUserId: session.user.id,
        cartId: cartId || null,
        orderId,
        totalAmount: Number(amount),
        affiliateCommission: ownerCommission,
        referredBonus: customerBonus,
        status: 'paid',
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        walletBalance: {
          increment: customerBonus,
        },
      },
    });

    return NextResponse.json({
      success: true,
      ownerCommission,
      customerBonus,
      newEarnings: updatedAffiliate.earnings,
      affiliateId,
    });

  } catch (error) {
    console.error('Error crediting affiliate commission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}