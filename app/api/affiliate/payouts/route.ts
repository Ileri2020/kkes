import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.user.id } });
    if (!affiliate) {
      return NextResponse.json({ payouts: [], message: 'Not an affiliate' });
    }

    const payouts = await prisma.affiliatePayout.findMany({
      where: { affiliateIdFk: affiliate.id },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error('Fetch affiliate payouts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.user.id } });
    if (!affiliate) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 });
    }

    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateIdFk: affiliate.id,
        amount: Number(amount),
        status: 'requested',
      },
    });

    return NextResponse.json({ success: true, payout });
  } catch (error) {
    console.error('Create affiliate payout request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
