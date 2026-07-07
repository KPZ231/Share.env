import { Skeleton } from "@/components/skeleton";

export default function SignupLoading() {
  return (
    <div className="mx-auto max-w-sm space-y-4 p-6 py-24">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
