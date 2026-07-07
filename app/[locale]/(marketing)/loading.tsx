import { Skeleton } from "@/components/skeleton";

export default function MarketingLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 py-24 text-center">
      <Skeleton className="mx-auto h-10 w-2/3" />
      <Skeleton className="mx-auto h-5 w-1/2" />
      <Skeleton className="mx-auto h-10 w-40" />
    </div>
  );
}
