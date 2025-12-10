import { Skeleton } from "@/components/ui/skeleton";

export function VideoListSkeleton() {
  return (
    <div className="space-y-6">
      {/* 統計資訊骨架 */}
      <div className="flex justify-end">
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* 影片網格骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            {/* 影片縮圖 */}
            <Skeleton className="aspect-video rounded-lg" />
            {/* 標題 */}
            <Skeleton className="h-4 w-full" />
            {/* 副標題/描述 */}
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}