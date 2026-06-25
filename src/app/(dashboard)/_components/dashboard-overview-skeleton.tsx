import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[16px] border border-[#E6E7E6] bg-white p-5 shadow-[0px_4px_12px_0px_#0000000D]"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-12 w-12 rounded-[12px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
