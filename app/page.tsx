import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import GlobeApp from "@/components/GlobeApp";

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  let userEmail: string | null = null;

  if (configured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    userEmail = user.email ?? null;
  }

  return <GlobeApp configured={configured} userEmail={userEmail} />;
}
