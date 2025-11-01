"use client";

import { motion } from 'framer-motion';

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3"
        >
          {/* Avatar skeleton */}
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}


