import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { encryptSecret, decryptSecret } from "@/lib/totp-crypto";
import type { GithubTokenExchange } from "@/lib/github";

export type GithubConnectionInfo = { login: string; avatarUrl: string | null };

export async function getGithubConnectionInfo(): Promise<GithubConnectionInfo | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("github_connections")
    .select("github_login, github_avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return { login: data.github_login, avatarUrl: data.github_avatar_url };
}

/** Decrypts the caller's own stored token  callers always fetch with their own GitHub identity, never someone else's. */
export async function getDecryptedGithubToken(): Promise<string | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("github_connections")
    .select("access_token_enc, access_token_iv, access_token_tag")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return decryptSecret({ ciphertext: data.access_token_enc, iv: data.access_token_iv, tag: data.access_token_tag });
}

export async function saveGithubConnection(userId: string, exchange: GithubTokenExchange): Promise<void> {
  const encrypted = encryptSecret(exchange.accessToken);
  const supabase = await createClient();
  const { error } = await supabase.from("github_connections").upsert(
    {
      user_id: userId,
      github_user_id: exchange.githubUserId,
      github_login: exchange.githubLogin,
      github_avatar_url: exchange.githubAvatarUrl,
      access_token_enc: encrypted.ciphertext,
      access_token_iv: encrypted.iv,
      access_token_tag: encrypted.tag,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}
