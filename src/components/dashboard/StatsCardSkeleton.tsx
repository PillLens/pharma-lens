import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatsCardSkeletonProps {
  className?: string;
}

export const StatsCardSkeleton: React.FC<StatsCardSkeletonProps> = ({ className }) => {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border bg-card p-4",
      "before:absolute before:inset-0 before:-translate-x-full",
      "before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r",
      "before:from-transparent before:via-white/10 before:to-transparent",
      className
    )}>
      <div className="space-y-3">
        {/* Icon skeleton */}
        <Skeleton className="w-10 h-10 rounded-lg" />
        
        {/* Value skeleton */}
        <Skeleton className="h-8 w-16" />
        
        {/* Label skeleton */}
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
};
