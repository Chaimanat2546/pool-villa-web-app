import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getRoleHomePath,
  normalizeUserRole,
  type UserRole,
} from "@/lib/auth/roles";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: UserRole;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .maybeSingle();

  return {
    id: data.claims.sub,
    email:
      typeof data.claims.email === "string" ? data.claims.email : null,
    role: normalizeUserRole(profile?.role),
  };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireCurrentUser();

  if (user.role !== role) {
    redirect(getRoleHomePath(user.role));
  }

  return user;
}
