import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const RemindersLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 pb-20">
      {/* Summary Dashboard Skeleton */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-3xl border-0 shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Adherence Overview Skeleton */}
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-2 w-full mb-6" />
            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-20 w-full rounded-xl mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Status Skeleton */}
      <div className="px-4">
        <Card className="rounded-xl border">
          <CardContent className="p-3 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </CardContent>
        </Card>
      </div>

      {/* Filters Skeleton */}
      <div className="px-4">
        <Skeleton className="h-10 w-full rounded-xl mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full ml-auto" />
        </div>
      </div>

      {/* Timeline Skeleton */}
      <div className="px-4">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="text-right">
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <Skeleton className="h-2 w-full mb-6" />
            
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-2 mb-4">
                <Skeleton className="w-5 h-5 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Reminder Cards Skeleton */}
      <div className="px-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-3xl border-0 shadow-sm">
            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>

              {/* Details */}
              <div className="space-y-4 mb-5">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-3 mb-5">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-12 w-20 rounded-xl" />
                  <Skeleton className="h-12 w-20 rounded-xl" />
                  <Skeleton className="h-12 w-20 rounded-xl" />
                </div>
              </div>

              {/* Next Dose */}
              <Skeleton className="h-16 w-full rounded-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RemindersLoadingSkeleton;
