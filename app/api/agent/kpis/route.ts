import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = session.user.email;
  const me = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get date range for calculations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Get agent's assigned orders in the last 30 days
    const assignedOrders = await prisma.order.findMany({
      where: {
        assignedToId: me.id,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        attempts: true
      }
    });

    // Calculate KPIs
    const totalCalls = assignedOrders.reduce((sum, order) => sum + order.attempts.length, 0);
    const assignedOrdersCount = assignedOrders.length;
    
    // Count orders by status
    const confirmedCount = assignedOrders.filter(order => order.status === 'CONFIRMED').length;
    const cancelledCount = assignedOrders.filter(order => order.status === 'CANCELLED').length;
    const activeCount = assignedOrders.filter(order => order.status === 'ACTIVE').length;
    const postponedCount = assignedOrders.filter(order => order.status === 'POSTPONED').length;
    
    // Calculate conversion rate (confirmed / total assigned)
    const conversionRate = assignedOrdersCount > 0 ? (confirmedCount / assignedOrdersCount * 100) : 0;

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await prisma.order.findMany({
      where: {
        assignedToId: me.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const todayCalls = await prisma.attempt.findMany({
      where: {
        agentId: me.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const kpis = {
      agentId: me.id, // Include agent ID for socket room joining
      totalCalls,
      assignedOrders: assignedOrdersCount,
      confirmed: confirmedCount,
      cancelled: cancelledCount,
      active: activeCount,
      postponed: postponedCount,
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
      todayCalls: todayCalls.length,
      todayOrders: todayOrders.length,
      // Additional realistic metrics
      averageCallsPerOrder: assignedOrdersCount > 0 ? Math.round((totalCalls / assignedOrdersCount) * 10) / 10 : 0,
      successRate: totalCalls > 0 ? Math.round((confirmedCount / totalCalls) * 100 * 10) / 10 : 0
    };

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Error fetching agent KPIs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


