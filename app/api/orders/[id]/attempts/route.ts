import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitAttemptRecorded } from '@/lib/socket';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = session.user.email;
  const me = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { result, reason, notes } = body as {
    result: 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'CUSTOMER_ASKED_TO_CALL_LATER' | 'CUSTOMER_NOT_INTERESTED' | 'OTHER';
    reason?: string;
    notes?: string;
  };

  // Verify the order exists and is assigned to this agent
  const order = await prisma.order.findUnique({ 
    where: { id: params.id },
    include: { attempts: true }
  });
  
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.assignedToId !== me.id) {
    return NextResponse.json({ error: 'Not authorized to record attempts for this order' }, { status: 403 });
  }

  // Don't allow attempts on already resolved orders
  if (order.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Cannot record attempts on resolved orders' }, { status: 400 });
  }

  try {
    // Get the next attempt number
    const attemptsCount = await prisma.attempt.count({ where: { orderId: order.id } });
    
    // Create the attempt record
    const attempt = await prisma.attempt.create({
      data: {
        orderId: order.id,
        agentId: me.id,
        attemptNumber: attemptsCount + 1,
        result,
        reason: reason || undefined,
      },
    });

    // Emit socket event for real-time updates to the assigned agent
    emitAttemptRecorded(order.assignedToId!, order.id, attempt.id, result, attempt.attemptNumber, reason);

    return NextResponse.json(attempt);
  } catch (error) {
    console.error('Error recording attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = session.user.email;
  const me = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get order with attempts
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      attempts: {
        orderBy: { attemptNumber: 'asc' },
        include: { agent: { select: { name: true, email: true } } }
      }
    }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Check if user can view this order
  const role = (session.user as any)?.role as string | undefined;
  if (role !== 'ADMIN' && order.assignedToId !== me.id) {
    return NextResponse.json({ error: 'Not authorized to view this order' }, { status: 403 });
  }

  return NextResponse.json(order.attempts);
}
