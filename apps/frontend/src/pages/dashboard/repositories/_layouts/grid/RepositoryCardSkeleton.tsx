import { cn } from '@frontend/lib/utils';

export const RepositoryCardSkeleton = () => {
  return (
    <div
      className={cn(
        'border-border bg-card flex h-[280px] animate-pulse flex-col rounded-lg border p-6'
      )}
    >
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="bg-secondary/50 h-14 w-14 rounded-lg" />
        <div className="bg-secondary/50 h-8 w-8 rounded-lg" />
      </div>

      {/* Content skeleton */}
      <div className="mt-4 flex-1 space-y-3">
        <div className="bg-secondary/50 h-6 w-3/4 rounded" />
        <div className="bg-secondary/50 h-4 w-1/2 rounded" />
        <div className="space-y-2">
          <div className="bg-secondary/50 h-4 w-full rounded" />
          <div className="bg-secondary/50 h-4 w-5/6 rounded" />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="mt-auto pt-4">
        <div className="bg-secondary/50 h-4 w-full rounded" />
      </div>
    </div>
  );
};
