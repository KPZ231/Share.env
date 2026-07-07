import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { getPublicProfile, getAvatarSignedUrl } from "@/lib/profile";
import { Breadcrumbs } from "@/components/breadcrumbs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.profile", path: "/u", noindex: true });
}

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const t = await getTranslations("publicProfile");
  const dashboardT = await getTranslations("dashboard.breadcrumbs");
  const membersT = await getTranslations("members");

  const profile = await getPublicProfile(userId);
  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-body">{t("notFound")}</p>
      </div>
    );
  }
  const avatarUrl = await getAvatarSignedUrl(profile.avatarPath);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Breadcrumbs
        items={[
          { label: dashboardT("dashboard"), href: "/dashboard" },
          { label: membersT("breadcrumb"), href: "/members" },
          { label: profile.displayName || membersT("unnamed") },
        ]}
      />

      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={72}
            height={72}
            className="size-18 rounded-full border border-hairline-strong object-cover"
          />
        ) : (
          <div className="flex size-18 items-center justify-center rounded-full border border-hairline-strong bg-surface-elevated text-2xl text-mute">
            {(profile.displayName || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">
          {profile.displayName || membersT("unnamed")}
        </h1>
      </div>

      <p className="rounded-lg border border-hairline-strong bg-surface-soft p-6 text-[14px] text-body">
        {profile.bio || t("noBio")}
      </p>
    </div>
  );
}
