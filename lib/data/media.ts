import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/auth";
import { optimizeImage } from "@/lib/media/image";
import { prepareVideo } from "@/lib/media/video";
import {
  MAX_MEDIA_PER_LOCATION,
  MEDIA_BUCKET,
  SIGNED_URL_TTL_SECONDS,
} from "@/lib/constants";
import {
  MediaPipelineError,
  type LocationRow,
  type MediaItem,
  type MediaRow,
} from "@/lib/types";

/** Rows + fresh signed URLs (private bucket) for one location, newest first. */
export async function listMediaWithUrls(
  locationId: string,
): Promise<MediaItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: rows, error } = await supabase
    .from("media")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message.toUpperCase());
  if (rows.length === 0) return [];

  const { data: signed, error: signError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(
      rows.map((r) => r.storage_path),
      SIGNED_URL_TTL_SECONDS,
    );
  if (signError) throw new Error(signError.message.toUpperCase());

  return rows.map((row, i) => ({
    ...row,
    signedUrl: signed[i]?.signedUrl ?? "",
  }));
}

/**
 * Full upload path: optimization pipeline → private storage upload → media
 * row insert (DB trigger enforces the 15-item cap) → signed URL. If the row
 * insert is rejected, the uploaded object is rolled back.
 */
export async function uploadMedia(
  location: LocationRow,
  file: File,
): Promise<MediaItem> {
  const optimized = file.type.startsWith("video/")
    ? await prepareVideo(file)
    : await optimizeImage(file);

  const userId = await getCurrentUserId();
  const supabase = getSupabaseBrowserClient();
  const storagePath = `${userId}/${location.id}/${crypto.randomUUID()}.${optimized.ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, optimized.blob, {
      contentType: optimized.contentType,
      upsert: false,
    });
  if (uploadError) {
    throw new MediaPipelineError(`UPLOAD FAILED — ${uploadError.message.toUpperCase()}`);
  }

  const { data: row, error: insertError } = await supabase
    .from("media")
    .insert({
      location_id: location.id,
      user_id: userId,
      storage_path: storagePath,
      media_type: optimized.mediaType,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    if (insertError.message.includes("MEDIA_LIMIT_REACHED")) {
      throw new MediaPipelineError(
        `LIMIT REACHED — MAX ${MAX_MEDIA_PER_LOCATION} MEDIA PER LOCATION`,
      );
    }
    throw new MediaPipelineError(insertError.message.toUpperCase());
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (signError) throw new Error(signError.message.toUpperCase());

  return { ...row, signedUrl: signed.signedUrl };
}

/** Storage object first (best-effort), then the row. */
export async function deleteMedia(item: MediaRow): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  try {
    await supabase.storage.from(MEDIA_BUCKET).remove([item.storage_path]);
  } catch {
    // Orphaned private objects are acceptable; the row is the source of truth.
  }
  const { error } = await supabase.from("media").delete().eq("id", item.id);
  if (error) throw new Error(error.message.toUpperCase());
}
