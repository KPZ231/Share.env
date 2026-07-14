import { Skeleton } from "@/components/skeleton";

export default function BillingLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-64" />
      <div>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-2 h-4 w-32" />
      </div>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-11 w-40 rounded-full" />
    </div>
  );
}
