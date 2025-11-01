import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AgentLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session) {
    redirect('/auth/signin');
  }
  if (role !== 'CSR_AGENT' && role !== 'ADMIN') {
    redirect('/auth/signin');
  }
  return <>{children}</>;
}












