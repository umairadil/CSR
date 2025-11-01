import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any)?.role as string | undefined;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get date range for calculations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Get all orders in the last 30 days
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        assignedTo: true,
        attempts: true
      }
    });

    // Get all orders (total)
    const totalOrders = await prisma.order.count();

    // Calculate KPIs
    const confirmedCount = orders.filter(order => order.status === 'CONFIRMED').length;
    const cancelledCount = orders.filter(order => order.status === 'CANCELLED').length;
    const activeCount = orders.filter(order => order.status === 'ACTIVE').length;
    const postponedCount = orders.filter(order => order.status === 'POSTPONED').length;
    
    // Calculate conversion rate (confirmed / total in last 30 days)
    const conversionRate = orders.length > 0 ? (confirmedCount / orders.length * 100) : 0;

    // Get active agents count
    const activeAgents = await prisma.user.count({
      where: {
        role: 'CSR_AGENT',
        status: 'ACTIVE'
      }
    });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const todayCalls = await prisma.attempt.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Get top agents by conversion rate
    const agentStats = await prisma.user.findMany({
      where: {
        role: 'CSR_AGENT',
        status: 'ACTIVE'
      },
      include: {
        assignedOrders: {
          where: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    });

    const topAgents = agentStats
      .map(agent => {
        const assigned = agent.assignedOrders.length;
        const confirmed = agent.assignedOrders.filter(order => order.status === 'CONFIRMED').length;
        const conversionRate = assigned > 0 ? (confirmed / assigned * 100) : 0;
        
        return {
          name: agent.name || agent.email,
          assigned,
          confirmed,
          conversionRate: Math.round(conversionRate * 10) / 10
        };
      })
      .filter(agent => agent.assigned > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);

    // Get agent online status from Socket.IO using unified tracking
    const connectedUsers = (global as any).__connectedUsers as Map<string, { orderSocketId: string | null, chatSocketId: string | null, lastSeen: Date, status: string }> | undefined;
    
    // Get all agents with their online status
    const agentsWithStatus = agentStats.map(agent => {
      // Check if user is connected to either orders or chat namespace
      const userData = connectedUsers?.get(agent.id);
      const isOnline = userData && (userData.orderSocketId !== null || userData.chatSocketId !== null) && userData.status === 'online';
      
      return {
        id: agent.id,
        name: agent.name || agent.email,
        email: agent.email,
        status: isOnline ? 'online' : 'offline',
        lastSeen: userData?.lastSeen?.toISOString() || null,
        assigned: agent.assignedOrders.length,
        confirmed: agent.assignedOrders.filter(order => order.status === 'CONFIRMED').length,
        conversionRate: agent.assignedOrders.length > 0 ? 
          Math.round((agent.assignedOrders.filter(order => order.status === 'CONFIRMED').length / agent.assignedOrders.length * 100) * 10) / 10 : 0
      };
    });

    const kpis = {
      totalOrders,
      confirmed30d: confirmedCount,
      cancelled30d: cancelledCount,
      active30d: activeCount,
      postponed30d: postponedCount,
      conversionRate: Math.round(conversionRate * 10) / 10,
      activeAgents,
      onlineAgents: agentsWithStatus.filter(agent => agent.status === 'online').length,
      todayOrders: todayOrders.length,
      todayCalls,
      topAgents,
      agentsWithStatus, // Include detailed agent status
      // Additional realistic metrics
      averageOrdersPerAgent: activeAgents > 0 ? Math.round((orders.length / activeAgents) * 10) / 10 : 0,
      totalCalls30d: orders.reduce((sum, order) => sum + order.attempts.length, 0),
      averageCallsPerOrder: orders.length > 0 ? Math.round((orders.reduce((sum, order) => sum + order.attempts.length, 0) / orders.length) * 10) / 10 : 0
    };

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Error fetching admin KPIs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


