export type MediaType = "image" | "video";

export interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  cgu_accepted: boolean;
  created_at: string;
}

export interface LocationRow {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface MediaRow {
  id: string;
  location_id: string;
  user_id: string;
  storage_path: string;
  media_type: MediaType;
  created_at: string;
}

export interface LocationInsert {
  id?: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at?: string;
}

export interface MediaInsert {
  id?: string;
  location_id: string;
  user_id: string;
  storage_path: string;
  media_type: MediaType;
  created_at?: string;
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  cgu_accepted?: boolean;
}

/** Typed schema for supabase-js clients. */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileRow;
        Update: ProfileUpdate;
        Relationships: [];
      };
      locations: {
        Row: LocationRow;
        Insert: LocationInsert;
        Update: Partial<LocationInsert>;
        Relationships: [];
      };
      media: {
        Row: MediaRow;
        Insert: MediaInsert;
        Update: Partial<MediaInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      media_type: MediaType;
    };
    CompositeTypes: Record<string, never>;
  };
};

/** A media row enriched with a short-lived signed URL for rendering. */
export interface MediaItem extends MediaRow {
  signedUrl: string;
}

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
}

/** Output of the client-side optimization pipeline, ready for upload. */
export interface OptimizedMedia {
  blob: Blob;
  ext: "webp" | "mp4" | "webm";
  contentType: string;
  mediaType: MediaType;
}

/** Raised by the media pipeline with a user-displayable (brutalist, uppercase) message. */
export class MediaPipelineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaPipelineError";
  }
}
