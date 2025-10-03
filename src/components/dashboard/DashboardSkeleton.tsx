import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCardSkeleton } from './StatsCardSkeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header Skeleton */}
      <div className="px-4 pt-6 pb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-10 h-10 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          <Skeleton className="w-24 h-8 rounded-full" />
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      {/* Quick Stats Skeleton */}
      <div className="px-6 mb-8">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      </div>

      {/* Today's Focus Card Skeleton */}
      <div className="px-6 mb-8">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>

      {/* Action Cards Skeleton */}
      <div className="px-6 space-y-4">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};
