import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const role = url.searchParams.get('role') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '50')));

    const where: any = {};
    if (status) where.status = status;
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users for chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


