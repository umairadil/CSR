import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  console.log('Orders API - Session:', session?.user?.email, 'Role:', (session?.user as any)?.role);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('pageSize') || '50')));
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const sortDir = (url.searchParams.get('sortDir') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const search = url.searchParams.get('search')?.trim();
  const assignedFilter = url.searchParams.get('assigned'); // 'assigned' | 'unassigned' | undefined

  const role = (session.user as any)?.role as string | undefined;
  const userEmail = session.user.email;
  const me = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const whereBase: any = {};
  // Filter by agent for non-admin users (both CSR_AGENT and AGENT roles)
  if (role !== 'ADMIN') {
    whereBase.assignedToId = me.id;
    console.log('Agent filter applied - assignedToId:', me.id, 'User email:', userEmail, 'Role:', role);
  }
  if (role === 'ADMIN' && assignedFilter) {
    if (assignedFilter === 'assigned') whereBase.NOT = { assignedToId: null };
    if (assignedFilter === 'unassigned') whereBase.assignedToId = null;
  }
  // Status filter semantics:
  // - Agents: default to ACTIVE if not provided
  // - Admins: no default filter; allow ALL when status=ALL
  const statusParam = url.searchParams.get('status');
  if (role === 'ADMIN') {
    if (statusParam && statusParam !== 'ALL') whereBase.status = statusParam;
  } else {
    const effectiveStatus = statusParam || 'ACTIVE';
    if (effectiveStatus !== 'ALL') whereBase.status = effectiveStatus;
  }

  if (search) {
    whereBase.OR = [
      { customerName: { contains: search } },
      { mobileNumber: { contains: search } },
      { city: { contains: search } },
      { address: { contains: search } },
    ];
  }

  console.log('Final whereBase filter:', JSON.stringify(whereBase, null, 2));
  const [total, rows] = await Promise.all([
    prisma.order.count({ where: whereBase }),
    prisma.order.findMany({
      where: whereBase,
      orderBy: { [sortBy]: sortDir as 'asc' | 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  console.log('Query results - Total:', total, 'Rows:', rows.length);

  return NextResponse.json({ rows, total, page, pageSize });
}





