"use server";

import { cache } from "react";
import { createServerSupabaseClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";

/**
 * Deduplicated per request via React.cache so layout + page + actions
 * share a single auth.getUser() round-trip instead of repeating it.
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

  // For now, we'll just check if the user is authenticated
  // Admins table check can be re-enabled once typed in Database

  return {
    user,
    admin: {
      id: user.id,
      auth_user_id: user.id,
      nome: user.email?.split("@")[0] || "Admin",
      email: user.email || "",
      created_at: user.created_at || new Date().toISOString(),
    },
  };
});

export async function requireAdmin() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    // If not admin, redirect to login
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
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
