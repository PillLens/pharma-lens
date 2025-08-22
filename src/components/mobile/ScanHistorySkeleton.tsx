import React from 'react';
import { MobileCard, MobileCardContent, MobileCardHeader } from '@/components/ui/mobile/MobileCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ScanHistorySkeletonProps {
  count?: number;
}

const ScanHistorySkeleton: React.FC<ScanHistorySkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <MobileCard key={index} className="animate-pulse">
          <MobileCardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Status indicator skeleton */}
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="w-12 h-5 rounded-full" />
                </div>
                
                {/* Medication name skeleton */}
                <Skeleton className="w-3/4 h-5 mb-2" />
                
                {/* Generic name and details skeleton */}
                <Skeleton className="w-1/2 h-4 mb-3" />
                
                {/* Timestamp skeleton */}
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
              
              {/* Quality badge skeleton */}
              <div className="flex flex-col gap-2">
                <Skeleton className="w-16 h-6 rounded-full" />
                <Skeleton className="w-12 h-5 rounded-full" />
              </div>
            </div>
          </MobileCardHeader>
          
          <MobileCardContent>
            {/* Risk flags skeleton (sometimes) */}
            {index % 3 === 0 && (
              <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                <Skeleton className="w-20 h-4 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="w-full h-3" />
                  <Skeleton className="w-4/5 h-3" />
                </div>
              </div>
            )}
            
            {/* Action buttons skeleton */}
            <div className="flex justify-end gap-2">
              <Skeleton className="w-16 h-8 rounded" />
              <Skeleton className="w-18 h-8 rounded" />
            </div>
          </MobileCardContent>
          
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </MobileCard>
      ))}
    </div>
  );
};

export default ScanHistorySkeleton;