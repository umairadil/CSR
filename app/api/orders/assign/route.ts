import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitOrderEvent, emitOrderAssigned } from '@/lib/socket';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as any)?.role as string | undefined;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { orderIds, agentId } = body as { orderIds: string[]; agentId?: string | null };
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return NextResponse.json({ error: 'orderIds required' }, { status: 400 });
  }
  if (agentId) {
    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    if (agent.role !== 'CSR_AGENT') return NextResponse.json({ error: 'Target must be an agent' }, { status: 400 });
    if ((agent as any).status && (agent as any).status !== 'ACTIVE') return NextResponse.json({ error: 'Agent disabled' }, { status: 400 });
  }

  // Update orders with new assignment
  await prisma.order.updateMany({ 
    where: { id: { in: orderIds } }, 
    data: { 
      assignedToId: agentId ?? null,
      status: 'ACTIVE' // Ensure assigned orders are ACTIVE
    } 
  });

  // If reassigning to a new agent, clear previous attempts to start fresh
  if (agentId) {
    // Delete existing attempts for these orders to start with clean slate
    await prisma.attempt.deleteMany({
      where: { orderId: { in: orderIds } }
    });
  }

  // Emit real-time events
  for (const id of orderIds) {
    emitOrderEvent('orderAssigned', { id, agentId: agentId ?? null });
    
    // Emit to specific agent if assigned
    if (agentId) {
      emitOrderAssigned(agentId);
    }
  }

  return NextResponse.json({ ok: true, count: orderIds.length, agentId: agentId ?? null });
}





