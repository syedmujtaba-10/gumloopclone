import { Skeleton } from "@/components/ui/skeleton";

export default function RunsLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-7 w-36 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card px-4 py-3 flex items-center gap-4">
            <Skeleton className="w-6 h-6 rounded flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-14 hidden sm:block" />
            <Skeleton className="h-4 w-20 hidden md:block" />
            <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
