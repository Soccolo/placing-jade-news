"use client";

export default function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {/* Featured skeleton */}
      <div className="rounded-2xl p-8 bg-jade-50/50 border border-jade-100/50">
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-28 skeleton-shimmer rounded-full" />
          <div className="h-5 w-20 skeleton-shimmer rounded-full" />
        </div>
        <div className="h-7 w-3/4 skeleton-shimmer rounded-lg mb-3" />
        <div className="h-7 w-1/2 skeleton-shimmer rounded-lg mb-5" />
        <div className="space-y-2.5">
          <div className="h-4 w-full skeleton-shimmer rounded-md" />
          <div className="h-4 w-full skeleton-shimmer rounded-md" />
          <div className="h-4 w-3/4 skeleton-shimmer rounded-md" />
        </div>
      </div>

      {/* Grid skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-7 bg-jade-50/30 border border-jade-100/30"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="h-4 w-20 skeleton-shimmer rounded-md mb-4" />
            <div className="h-5 w-4/5 skeleton-shimmer rounded-lg mb-2.5" />
            <div className="h-5 w-3/5 skeleton-shimmer rounded-lg mb-4" />
            <div className="space-y-2">
              <div className="h-3.5 w-full skeleton-shimmer rounded-md" />
              <div className="h-3.5 w-full skeleton-shimmer rounded-md" />
              <div className="h-3.5 w-2/3 skeleton-shimmer rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
