import { Skeleton } from "@/components/skeleton";

export default function EnvironmentDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
