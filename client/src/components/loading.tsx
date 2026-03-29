'use client';

export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-900" style={{ animationDelay: '0ms' }} />
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-600" style={{ animationDelay: '150ms' }} />
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm font-medium text-slate-400">{message}</p>
      </div>
    </div>
  );
}

export function AppShellLoader() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar skeleton — desktop only */}
      <div className="hidden w-60 border-r border-slate-200 bg-white p-5 lg:block">
        <div className="mb-8 h-7 w-28 animate-pulse rounded-lg bg-slate-100" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-50" />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <div className="h-7 w-36 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-slate-100" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-8 w-36 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-3 h-3 w-28 animate-pulse rounded bg-slate-50" />
            </div>
            <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-7 w-28 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-3 h-3 w-24 animate-pulse rounded bg-slate-50" />
            </div>
            <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 sm:max-w-[200px]">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-7 w-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-3 h-3 w-16 animate-pulse rounded bg-slate-50" />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            <div className="flex-[2] rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-44 animate-pulse rounded bg-slate-50" />
              <div className="mt-6 flex items-end gap-2" style={{ height: '160px' }}>
                {[40, 65, 35, 80, 55, 70, 45, 60].map((h, i) => (
                  <div key={i} className="flex-1 animate-pulse rounded-t-sm bg-slate-100" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-36 animate-pulse rounded bg-slate-50" />
              <div className="mx-auto mt-6 h-32 w-32 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardLoader() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-900" style={{ animationDelay: '0ms' }} />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-600" style={{ animationDelay: '150ms' }} />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-sm text-slate-400">Loading data...</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-100 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <Skeleton className="h-4 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-6 py-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  const heights = [50, 70, 40, 80, 60, 45, 75, 55];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <Skeleton className="mb-6 h-5 w-40" />
      <div className="flex items-end gap-2" style={{ height: '200px' }}>
        {heights.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm animate-pulse bg-slate-100" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}
