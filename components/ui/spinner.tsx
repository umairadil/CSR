"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: number;
}

export function Spinner({ className, size = 24 }: SpinnerProps) {
  const dimension = `${size}px`;
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-r-transparent text-muted-foreground",
        className
      )}
      style={{ width: dimension, height: dimension }}
      aria-label="Loading"
      role="status"
    />
  );
}



