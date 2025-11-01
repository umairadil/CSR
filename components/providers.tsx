"use client";
import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { RouteLoadingOverlay } from '@/components/RouteLoadingOverlay';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Respect reduced motion and defer Lenis init to idle to avoid jank/blank on first paint
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let cleanup: (() => void) | undefined;
    let rafId = 0;

    const startLenis = async () => {
      try {
        const { default: Lenis } = await import('lenis');
        const lenis = new Lenis({
          duration: 1.1,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          // Disable Lenis for chat areas to allow native scrolling
          content: typeof document !== 'undefined' ? document.querySelector('body > div') as HTMLElement : undefined,
        });

        const raf = (time: number) => {
          lenis.raf(time);
          rafId = window.requestAnimationFrame(raf);
        };

        // Start RAF only when page is visible
        const onVisibility = () => {
          if (document.visibilityState === 'visible') {
            if (!rafId) rafId = window.requestAnimationFrame(raf);
          } else if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = 0;
          }
        };
        document.addEventListener('visibilitychange', onVisibility);
        onVisibility();

        cleanup = () => {
          document.removeEventListener('visibilitychange', onVisibility);
          if (rafId) window.cancelAnimationFrame(rafId);
          lenis?.destroy?.();
        };
      } catch (err) {
        // Silently ignore if Lenis fails to load; app should still render
      }
    };

    // Defer to idle or after a short timeout so first content paints fast
    const idle: any = (window as any).requestIdleCallback;
    const idleId = typeof idle === 'function' ? idle(() => startLenis(), { timeout: 1200 }) : window.setTimeout(startLenis, 300);

    return () => {
      const cancelIdle: any = (window as any).cancelIdleCallback;
      if (typeof cancelIdle === 'function' && typeof idle === 'function') {
        cancelIdle(idleId);
      } else {
        window.clearTimeout(idleId as unknown as number);
      }
      cleanup?.();
    };
  }, []);

  return <SessionProvider>
    {children}
    <RouteLoadingOverlay />
  </SessionProvider>;
}





