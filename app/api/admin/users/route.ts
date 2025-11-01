import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any)?.role as string | undefined;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('pageSize') || '50')));
  const search = url.searchParams.get('search')?.trim();
  const status = url.searchParams.get('status') || undefined;
  const roleFilter = url.searchParams.get('role') || undefined;

  const where: any = {};
  if (status) where.status = status;
  if (roleFilter) where.role = roleFilter;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return NextResponse.json({ rows, total, page, pageSize });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any)?.role as string | undefined;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name, email, password, role: targetRole, status } = body as { name?: string; email: string; password: string; role: 'ADMIN' | 'CSR_AGENT'; status?: 'ACTIVE' | 'DISABLED' };
  if (!email || !password || !targetRole) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await prisma.user.create({ data: { name: name ?? null, email, passwordHash, role: targetRole, status: status ?? 'ACTIVE' } as any });
  return NextResponse.json(created, { status: 201 });
}







