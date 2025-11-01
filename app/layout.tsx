import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/navbar';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CSR Portal',
  description: 'Admin + Agent CSR portal with realtime grids'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}


