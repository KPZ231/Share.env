import { Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      <Skeleton className="h-6 w-48" />
      <div className="space-y-4 rounded-lg border border-hairline-strong bg-surface-soft p-6 lg:p-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-4 rounded-lg border border-hairline-strong bg-surface-soft p-6 lg:p-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
