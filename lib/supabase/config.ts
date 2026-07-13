/**
 * Env access is centralized here. NEXT_PUBLIC_* values are inlined into both
 * server and client bundles at build time; when they are absent the app runs
 * in a degraded "NOT CONFIGURED" mode instead of crashing the build.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return (
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("YOUR_PROJECT_REF") &&
    SUPABASE_ANON_KEY.length > 20
  );
}
