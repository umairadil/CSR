import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any)?.role as string | undefined;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name, role: targetRole, status, password } = body as Partial<{ name: string; role: 'ADMIN' | 'CSR_AGENT'; status: 'ACTIVE' | 'DISABLED'; password: string }>;
  const data: any = {};
  if (typeof name === 'string') data.name = name;
  if (typeof targetRole === 'string') data.role = targetRole;
  if (typeof status === 'string') data.status = status;
  if (typeof password === 'string' && password.length > 0) data.passwordHash = await bcrypt.hash(password, 10);

  const updated = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any)?.role as string | undefined;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (me?.id === params.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}









