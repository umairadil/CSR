import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PostLogin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session) redirect('/auth/signin');
  if (role === 'ADMIN') redirect('/admin');
  redirect('/agent');
}












