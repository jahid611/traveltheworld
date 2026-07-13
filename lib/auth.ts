import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  cguAccepted: boolean;
}

/**
 * Signs up with profile metadata. The profiles row is materialized
 * server-side by the handle_new_user trigger (see DB_SCHEMA.md), which also
 * re-validates CGU acceptance — the client checkbox alone is never trusted.
 */
export async function signUpWithProfile(
  input: SignUpInput,
): Promise<{ needsEmailConfirmation: boolean }> {
  if (!input.cguAccepted) {
    throw new Error("YOU MUST ACCEPT THE TERMS OF SERVICE (CGU)");
  }
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        cgu_accepted: true,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message.toUpperCase());
  return { needsEmailConfirmation: !data.session };
}

export async function signIn(email: string, password: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message.toUpperCase());
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}

/** Resolves the authenticated user id or throws — used before every write. */
export async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("NOT AUTHENTICATED");
  return user.id;
}
