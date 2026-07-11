"use server";

import { cache } from "react";
import { createServerSupabaseClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import { resolveAdminRole, hasPermission, type Permission } from "@/lib/security/rbac";

/**
 * Deduplicated per request via React.cache.
 * Exige sessão Supabase Auth válida (admin panel).
 */
export const getAdminUser = cache(async () => {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const role = resolveAdminRole(
    (user.app_metadata || user.user_metadata) as { role?: string } | null
  );

  return {
    user,
    role,
    admin: {
      id: user.id,
      auth_user_id: user.id,
      nome:
        (user.user_metadata?.nome as string | undefined) ||
        user.email?.split("@")[0] ||
        "Admin",
      email: user.email || "",
      created_at: user.created_at || new Date().toISOString(),
    },
  };
});

export async function requireAdmin() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return adminUser;
}

/**
 * Para Route Handlers / APIs: não redireciona, lança erro.
 */
export async function requireAdminApi() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    throw new Error("UNAUTHORIZED");
  }
  return adminUser;
}

/** Exige permissão RBAC (pages/server actions — redireciona se sem login) */
export async function requirePermission(permission: Permission) {
  const adminUser = await requireAdmin();
  if (!hasPermission(adminUser.role, permission)) {
    throw new Error("Permissão insuficiente para esta ação");
  }
  return adminUser;
}

/** Permissão em APIs (sem redirect) */
export async function requirePermissionApi(permission: Permission) {
  const adminUser = await requireAdminApi();
  if (!hasPermission(adminUser.role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return adminUser;
}

export async function verifyAdmin() {
  const adminUser = await getAdminUser();

  return {
    isAdmin: !!adminUser,
    user: adminUser,
  };
}
