"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouteLoading } from "@/lib/routeLoading";
import { Spinner } from "@/components/ui/spinner";

export function RouteLoadingOverlay() {
  const pathname = usePathname();
  const { isLoading, hide } = useRouteLoading();

  // When the URL changes, consider navigation complete and hide the overlay after a short delay
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => hide(), 150);
    return () => clearTimeout(t);
  }, [pathname]);

  // Safety timeout to auto-hide in case navigation completes without pathname change
  useEffect(() => {
    if (!isLoading) return;
    const failSafe = setTimeout(() => hide(), 6000);
    return () => clearTimeout(failSafe);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-md bg-background/90 p-4 shadow">
        <Spinner size={22} />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}



