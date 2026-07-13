import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Email-confirmation callback: exchanges the one-time "code" for a session
 * (cookies are written by the server client) and lands the user on the globe.
 * Any failure — missing code, unconfigured env, rejected exchange — routes
 * back to /login with a flag the LoginForm renders as an error-block.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");

  if (isSupabaseConfigured() && code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      // fall through to the failure redirect
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation_failed", request.url),
  );
}
