import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitOrderEvent, emitOrderUpdate, emitOrderStatusChanged } from '@/lib/socket';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as any)?.role as string | undefined;
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { attempts: { orderBy: { attemptNumber: 'asc' } }, assignedTo: true } });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (role !== 'ADMIN' && order.assignedToId !== me.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(order);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as any)?.role as string | undefined;
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { codAmount, quantity, address, remarks, action, reason, dispatchDate } = body as Partial<{ codAmount: number; quantity: number; address: string; remarks: string; action: 'CONFIRMED' | 'CANCELLED' | 'POSTPONED'; reason: string; dispatchDate: string }>;

  // Only allow agents to edit their assigned orders; admin can edit any
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (role !== 'ADMIN' && order.assignedToId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data: any = {};
  if (typeof codAmount === 'number') data.codAmount = codAmount;
  if (typeof quantity === 'number') data.quantity = quantity;
  if (typeof address === 'string') data.address = address;
  if (typeof remarks === 'string') data.remarks = remarks;
  if (typeof dispatchDate === 'string') data.dispatchDate = new Date(dispatchDate);

  // Handle call action changes with attempt recording
  if (action) {
    if (action === 'CANCELLED' && !reason) {
      return NextResponse.json({ error: 'Cancellation reason required' }, { status: 400 });
    }
    if (action === 'CONFIRMED') {
      data.status = 'CONFIRMED';
      data.confirmationDate = new Date();
    } else if (action === 'CANCELLED') {
      data.status = 'CANCELLED';
    } else if (action === 'POSTPONED') {
      data.status = 'POSTPONED';
    }
  }

  const updated = await prisma.order.update({ where: { id: params.id }, data });

  // Record attempt if action provided
  if (action) {
    const attemptsCount = await prisma.attempt.count({ where: { orderId: updated.id } });
    await prisma.attempt.create({
      data: {
        orderId: updated.id,
        agentId: me.id,
        attemptNumber: attemptsCount + 1,
        result: action,
        reason: reason ?? undefined,
      },
    });
  }

  // Emit real-time updates to the assigned agent
  if (updated.assignedToId) {
    emitOrderUpdate(updated.assignedToId, updated.id, data);
    if (data.status) {
      emitOrderStatusChanged(updated.assignedToId, updated.id, data.status);
    }
  }
  
  // Also emit global events for admin dashboard
  emitOrderEvent('orderUpdated', { id: updated.id, changes: data });
  if (data.status) emitOrderEvent('orderStatusChanged', { id: updated.id, status: data.status });
  if (data.status === 'CONFIRMED') emitOrderEvent('orderConfirmed', { id: updated.id });
  if (data.status === 'CANCELLED') emitOrderEvent('orderCancelled', { id: updated.id });
  return NextResponse.json(updated);
}


