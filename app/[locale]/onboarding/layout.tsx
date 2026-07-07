import { requireUser } from "@/lib/auth";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background px-4 py-16">
      {children}
    </div>
  );
}
