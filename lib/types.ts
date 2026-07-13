export type MediaType = "image" | "video";

export type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  cgu_accepted: boolean;
  created_at: string;
}

export type LocationRow = {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export type MediaRow = {
  id: string;
  location_id: string;
  user_id: string;
  storage_path: string;
  media_type: MediaType;
  created_at: string;
}

export type LocationInsert = {
  id?: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at?: string;
}

export type MediaInsert = {
  id?: string;
  location_id: string;
  user_id: string;
  storage_path: string;
  media_type: MediaType;
  created_at?: string;
}

export type ProfileUpdate = {
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
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      media_type: MediaType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

/** A media row enriched with a short-lived signed URL for rendering. */
export type MediaItem = MediaRow & {
  signedUrl: string;
};

export type GeocodeResult = {
  name: string;
  latitude: number;
  longitude: number;
}

/** Output of the client-side optimization pipeline, ready for upload. */
export type OptimizedMedia = {
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
