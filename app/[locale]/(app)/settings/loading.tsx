import { Skeleton } from "@/components/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
      </div>
    </div>
  );
}
