"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-zinc-800/60",
        className
      )}
    />
  );
}

export function RoundCardSkeleton() {
  return (
    <div className="border border-zinc-800 bg-zinc-900/60 rounded-2xl p-6 space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="text-center space-y-3">
        <Skeleton className="h-3 w-20 mx-auto" />
        <Skeleton className="h-14 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <div className="flex gap-3 justify-center mt-4">
          <Skeleton className="h-16 w-24" />
          <Skeleton className="h-16 w-24" />
          <Skeleton className="h-16 w-24" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

export function NodeSkeleton() {
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
