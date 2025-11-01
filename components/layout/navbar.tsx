"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HeadphonesIcon } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouteLoading } from '@/lib/routeLoading';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { data } = useSession();
  const { show } = useRouteLoading();
  const pathname = usePathname();
  const role = (data?.user as any)?.role as string | undefined;
  const isAdmin = role === 'ADMIN';
  const isAgent = role === 'CSR_AGENT';

  return (
    <header className={cn('sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur')}> 
      <div className="container mx-auto flex h-14 items-center justify-between">
        {(() => {
          const targetHref = isAdmin ? '/admin' : isAgent ? '/agent' : '/';
          const handleClick = (e: React.MouseEvent) => {
            if (pathname === targetHref) {
              // Avoid redundant navigation when already on the target route
              e.preventDefault();
              return;
            }
            show();
          };
          return (
            <Link prefetch onClick={handleClick} href={targetHref} className="flex items-center gap-2 text-sm font-semibold">
              <HeadphonesIcon className="h-5 w-5" />
              <span>CSR Portal</span>
            </Link>
          );
        })()}
        <nav className="flex items-center gap-2 text-sm">
          {!data?.user && (
            <Link onClick={() => show()} href="/auth/signin">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
          )}
          {isAdmin && (
            <>
              <Link onClick={() => show()} href="/admin">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link onClick={() => show()} href="/admin/orders">
                <Button variant="ghost" size="sm">Orders</Button>
              </Link>
              <Link onClick={() => show()} href="/admin/users">
                <Button variant="ghost" size="sm">Users</Button>
              </Link>
              <Link onClick={() => show()} href="/admin/chat">
                <Button variant="ghost" size="sm">Chat</Button>
              </Link>
            </>
          )}
          {isAgent && (
            <>
              <Link onClick={() => show()} href="/agent">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link onClick={() => show()} href="/agent/orders">
                <Button variant="ghost" size="sm">My Orders</Button>
              </Link>
            </>
          )}
          {!!data?.user && (
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/auth/signin' })}>Sign out</Button>
          )}
        </nav>
      </div>
    </header>
  );
}





