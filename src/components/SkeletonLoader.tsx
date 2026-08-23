import { Compass } from 'lucide-react';

export default function SkeletonLoader() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12 space-y-8 animate-pulse" id="skeleton-container">
      {/* Banner Skeleton */}
      <div className="h-64 sm:h-96 bg-stone-200 rounded-2xl relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
        <Compass className="w-12 h-12 text-stone-300 animate-spin" style={{ animationDuration: '6s' }} />
      </div>

      {/* Grid of Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="border border-stone-200 rounded-xl overflow-hidden bg-white p-5 space-y-4">
            <div className="h-48 bg-stone-200 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-stone-200 rounded w-1/3" />
              <div className="h-6 bg-stone-200 rounded w-3/4" />
              <div className="h-4 bg-stone-200 rounded w-5/6" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-6 bg-stone-200 rounded w-1/4" />
              <div className="h-8 bg-stone-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeletonLoader() {
  return (
    <div className="w-full border border-stone-200 rounded-lg overflow-hidden bg-white animate-pulse" id="table-skeleton">
      <div className="bg-stone-50 border-b border-stone-200 p-4 grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="h-4 bg-stone-200 rounded w-2/3" />
        ))}
      </div>
      <div className="divide-y divide-stone-100">
        {[1, 2, 3, 4, 5].map((rowIdx) => (
          <div key={rowIdx} className="p-4 grid grid-cols-5 gap-4 items-center">
            <div className="h-4 bg-stone-200 rounded w-3/4" />
            <div className="h-4 bg-stone-200 rounded w-1/2" />
            <div className="h-4 bg-[#e2f1f1] rounded w-2/3" />
            <div className="h-4 bg-stone-200 rounded w-1/3" />
            <div className="h-8 bg-stone-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse" id="card-grid-skeleton">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="border border-stone-200 rounded-lg overflow-hidden bg-white p-5 space-y-4">
          <div className="h-40 bg-stone-200 rounded-md relative overflow-hidden" />
          <div className="space-y-3">
            <div className="h-3 bg-stone-200 rounded w-1/4" />
            <div className="h-5 bg-stone-200 rounded w-3/4" />
            <div className="h-3.5 bg-stone-200 rounded w-5/6" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-4 bg-stone-200 rounded w-1/4" />
            <div className="h-6 bg-stone-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-[18px] border border-stone-200 bg-white p-5 shadow-sm ${className}`.trim()}>
      <div className="h-40 rounded-[14px] bg-stone-200" />
      <div className="mt-4 space-y-3">
        <div className="h-3 w-1/4 rounded bg-stone-200" />
        <div className="h-5 w-3/4 rounded bg-stone-200" />
        <div className="h-3 w-5/6 rounded bg-stone-100" />
      </div>
    </div>
  );
}

export function SkeletonPackage({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse overflow-hidden rounded-[16px] border border-stone-200 bg-white shadow-sm ${className}`.trim()}>
      <div className="h-56 bg-stone-200" />
      <div className="space-y-3 p-6">
        <div className="h-3 w-1/3 rounded bg-stone-200" />
        <div className="h-6 w-3/4 rounded bg-stone-200" />
        <div className="h-3 w-full rounded bg-stone-100" />
        <div className="h-3 w-2/3 rounded bg-stone-100" />
      </div>
    </div>
  );
}

export function SkeletonDashboardCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-[18px] border border-stone-200 bg-white p-5 shadow-sm ${className}`.trim()}>
      <div className="h-3 w-1/3 rounded bg-stone-200" />
      <div className="mt-4 h-8 w-2/3 rounded bg-stone-200" />
      <div className="mt-3 h-3 w-1/2 rounded bg-stone-100" />
    </div>
  );
}

export function SkeletonBookingCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-[20px] border border-stone-200 bg-white p-5 shadow-sm ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <div className="h-3 w-20 rounded bg-stone-200" />
        <div className="h-7 w-20 rounded-full bg-stone-200" />
      </div>
      <div className="mt-4 h-24 rounded-[14px] bg-stone-100" />
    </div>
  );
}

