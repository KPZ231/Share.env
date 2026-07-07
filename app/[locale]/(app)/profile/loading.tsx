import { Skeleton } from "@/components/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 lg:p-8">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
