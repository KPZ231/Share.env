import { Skeleton } from "@/components/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-lg border border-hairline-strong bg-surface-soft p-8">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
