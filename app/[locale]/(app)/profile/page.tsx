import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { getOrCreateProfile, getAvatarSignedUrl } from "@/lib/profile";
import { requireUser } from "@/lib/auth";
import { getTwoFactorStatus } from "@/lib/two-factor";
import { getGithubConnectionInfo } from "@/lib/github-connection";
import { ProfileView } from "@/components/profile/profile-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.profile", path: "/profile", noindex: true });
}

export default async function ProfilePage() {
  const [user, profile, twoFactorStatus, githubConnection] = await Promise.all([
    requireUser(),
    getOrCreateProfile(),
    getTwoFactorStatus(),
    getGithubConnectionInfo(),
  ]);
  const avatarUrl = await getAvatarSignedUrl(profile.avatarPath);

  return (
    <ProfileView
      profile={profile}
      email={user.email ?? ""}
      avatarUrl={avatarUrl}
      twoFactorStatus={twoFactorStatus}
      githubConnection={githubConnection}
    />
  );
}
