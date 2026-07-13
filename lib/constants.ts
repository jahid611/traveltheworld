/** Globe geometry */
export const GLOBE_RADIUS = 1;
export const MARKER_ALTITUDE = 0.008;
/** Mean Earth radius — maps globe units to kilometres for the camera readout. */
export const EARTH_RADIUS_KM = 6371;

/** Camera mechanics */
export const CAMERA_INITIAL_DISTANCE = 2.8;
export const CAMERA_MIN_DISTANCE = 1.25;
export const CAMERA_MAX_DISTANCE = 4.5;
export const FLY_TO_DISTANCE = 1.9;
export const FLY_TO_DURATION_MS = 1400;

/** Media rules — mirrored by the database (see DB_SCHEMA.md) */
export const MAX_MEDIA_PER_LOCATION = 15;
export const MAX_IMAGE_MB = 2;
export const MAX_IMAGE_DIMENSION = 2560;
export const MAX_VIDEO_SECONDS = 15;
export const MAX_VIDEO_BYTES = 24 * 1024 * 1024;
export const RE_ENCODE_VIDEO_BPS = 2_500_000;
export const RE_ENCODE_AUDIO_BPS = 96_000;

/** Supabase storage */
export const MEDIA_BUCKET = "media";
export const SIGNED_URL_TTL_SECONDS = 3600;

/** Geocoding (OpenStreetMap Nominatim, no API key) */
export const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org";
