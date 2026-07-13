import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/lib/types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Per-request server client for Server Components and Route Handlers.
 * Callers must check isSupabaseConfigured() first. Return type is inferred
 * from the factory — supabase-js generic signatures move often.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore when middleware
          // is refreshing sessions.
        }
      },
    },
  });
}
