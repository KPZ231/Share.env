import { Skeleton } from "@/components/skeleton";

export default function NewEnvironmentLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 lg:p-8">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
