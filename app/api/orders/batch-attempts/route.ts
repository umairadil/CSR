import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orderIds } = await request.json();
    
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds must be a non-empty array' }, { status: 400 });
    }

    // Fetch all attempts for the given order IDs in a single query
    const attempts = await prisma.attempt.findMany({
      where: {
        orderId: {
          in: orderIds
        }
      },
      orderBy: {
        attemptNumber: 'asc'
      }
    });

    // Group attempts by orderId
    const attemptsByOrderId = attempts.reduce((acc, attempt) => {
      if (!acc[attempt.orderId]) {
        acc[attempt.orderId] = [];
      }
      acc[attempt.orderId].push(attempt);
      return acc;
    }, {} as { [orderId: string]: any[] });

    return NextResponse.json(attemptsByOrderId);
  } catch (error) {
    console.error('Error fetching batch attempts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


