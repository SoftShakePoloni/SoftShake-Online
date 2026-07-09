import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Cliente Supabase SSR para Server Components e Actions
 * Usa os cookies da requisição para recuperar a sessão
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://juzlblaxwybssbyddnwj.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1emxibGF4d3lic3NieWRkbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3OTk2MjYsImV4cCI6MjA5ODM3NTYyNn0.W1r0BnXZevVK-A5y97XBEoAOhehgA6fstgWueuJpoZA",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
