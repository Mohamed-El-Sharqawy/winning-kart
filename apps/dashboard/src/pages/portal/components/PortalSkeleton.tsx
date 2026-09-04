export function PortalSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-4 w-56 animate-pulse rounded-[6px] bg-volt-surface-2" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-[116px] animate-pulse rounded-wk bg-volt-surface-2" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-[320px] animate-pulse rounded-wk bg-volt-surface-2" />
        <div className="h-[320px] animate-pulse rounded-wk bg-volt-surface-2" />
      </div>
      <div className="h-48 animate-pulse rounded-wk bg-volt-surface-2" />
      <div className="h-4 w-32 animate-pulse rounded-[6px] bg-volt-surface-2" />
      <div className="h-44 animate-pulse rounded-wk bg-volt-surface-2" />
    </div>
  );
}
