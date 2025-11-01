"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PhoneCall, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-transparent dark:from-indigo-950/40 dark:via-background" />
      <section className="container mx-auto px-4 py-16">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold tracking-tight sm:text-5xl"
        >
          Modern CSR Portal for high‑velocity calling teams
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 max-w-2xl text-muted-foreground"
        >
          Realtime order grids, inline edits, leaderboards and a premium agent experience.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 flex gap-3"
        >
          <Link href="/auth/signin">
            <Button size="lg">Sign in</Button>
          </Link>
          <Link href="/auth/signin">
            <Button size="lg" variant="outline">Go to Dashboard</Button>
          </Link>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[{ title: 'Live Calling', icon: PhoneCall, value: 'Fast inline actions' }, { title: 'Analytics', icon: BarChart3, value: 'Leaderboards & trends' }, { title: 'Teams', icon: Users, value: 'Role-based access' }].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 * i }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{item.title}</CardTitle>
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}


