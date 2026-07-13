import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/auth";
import { MEDIA_BUCKET } from "@/lib/constants";
import type { LocationRow } from "@/lib/types";

/** All pins for the signed-in user (RLS scopes the query server-side too). */
export async function listLocations(): Promise<LocationRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message.toUpperCase());
  return data;
}

export async function createLocation(input: {
  name: string;
  latitude: number;
  longitude: number;
}): Promise<LocationRow> {
  const name = input.name.trim();
  if (!name) throw new Error("LOCATION NAME IS REQUIRED");
  if (Math.abs(input.latitude) > 90 || Math.abs(input.longitude) > 180) {
    throw new Error("COORDINATES OUT OF RANGE");
  }
  const userId = await getCurrentUserId();
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("locations")
    .insert({
      user_id: userId,
      name,
      latitude: input.latitude,
      longitude: input.longitude,
    })
    .select()
    .single();
  if (error) throw new Error(error.message.toUpperCase());
  return data;
}

/**
 * Deletes a pin. Media rows go with it via ON DELETE CASCADE; storage
 * objects are removed best-effort first (a failure there must not strand
 * the row deletion).
 */
export async function deleteLocation(location: LocationRow): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const folder = `${location.user_id}/${location.id}`;

  try {
    const { data: objects } = await supabase.storage
      .from(MEDIA_BUCKET)
      .list(folder, { limit: 100 });
    if (objects && objects.length > 0) {
      await supabase.storage
        .from(MEDIA_BUCKET)
        .remove(objects.map((o) => `${folder}/${o.name}`));
    }
  } catch {
    // Orphaned objects are invisible (private bucket) and re-collectable.
  }

  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", location.id);
  if (error) throw new Error(error.message.toUpperCase());
}
