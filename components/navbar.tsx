import { getUser } from "@/lib/auth";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  const user = await getUser();
  const account = user
    ? { email: user.email ?? "", name: (user.user_metadata?.full_name as string | undefined) ?? null }
    : null;
  return <NavbarClient account={account} />;
}
