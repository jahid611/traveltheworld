import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Lazily-created browser client singleton. Session persistence is handled by
 * @supabase/ssr cookie storage, so middleware and server components see the
 * same session as the browser.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "SUPABASE NOT CONFIGURED — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
    );
  }
  return browserClient;
}
