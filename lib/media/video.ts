import {
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  RE_ENCODE_AUDIO_BPS,
  RE_ENCODE_VIDEO_BPS,
} from "@/lib/constants";
import { MediaPipelineError, type OptimizedMedia } from "@/lib/types";

const ACCEPTED = new Map<string, "mp4" | "webm">([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
]);

/**
 * Client-side video pipeline:
 *  1. container must be MP4 or WebM,
 *  2. duration ≤ 15 s (metadata probe),
 *  3. size ≤ 24 MB, else a lightweight real-time re-encode is attempted via
 *     HTMLMediaElement.captureStream + MediaRecorder (WebM at ~2.5 Mbps) —
 *     deliberately no FFmpeg.wasm to keep the bundle small.
 */
export async function prepareVideo(file: File): Promise<OptimizedMedia> {
  const ext = ACCEPTED.get(file.type);
  if (!ext) {
    throw new MediaPipelineError("UNSUPPORTED VIDEO FORMAT — MP4 OR WEBM ONLY");
  }

  const duration = await probeDuration(file);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new MediaPipelineError("COULD NOT READ VIDEO METADATA");
  }
  if (duration > MAX_VIDEO_SECONDS + 0.25) {
    throw new MediaPipelineError(
      `VIDEO TOO LONG — ${Math.round(duration)}S / MAX ${MAX_VIDEO_SECONDS}S`,
    );
  }

  if (file.size <= MAX_VIDEO_BYTES) {
    return { blob: file, ext, contentType: file.type, mediaType: "video" };
  }

  const reencoded = await reencodeToWebm(file).catch(() => null);
  if (reencoded && reencoded.size > 0 && reencoded.size <= MAX_VIDEO_BYTES) {
    return {
      blob: reencoded,
      ext: "webm",
      contentType: "video/webm",
      mediaType: "video",
    };
  }

  throw new MediaPipelineError(
    "VIDEO TOO LARGE — MAX 24 MB AND RE-ENCODING UNAVAILABLE OR INSUFFICIENT",
  );
}

/** Reads duration from metadata without decoding the whole file. */
function probeDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new MediaPipelineError("VIDEO METADATA PROBE TIMED OUT"));
    }, 10_000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };

    video.onloadedmetadata = () => {
      const d = video.duration;
      cleanup();
      resolve(d);
    };
    video.onerror = () => {
      cleanup();
      reject(new MediaPipelineError("COULD NOT READ VIDEO METADATA"));
    };
    video.src = url;
  });
}

interface CaptureCapableVideo extends HTMLVideoElement {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
}

/**
 * Best-effort real-time re-encode at a bounded bitrate. Plays the (≤ 15 s)
 * clip once, muted, capturing the element's stream into MediaRecorder.
 * Trade-off: muted capture may drop the audio track in some browsers — this
 * path only runs for oversized files that would otherwise be rejected.
 */
function reencodeToWebm(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof MediaRecorder === "undefined") {
      reject(new MediaPipelineError("MEDIARECORDER UNSUPPORTED"));
      return;
    }
    const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(
      (t) => MediaRecorder.isTypeSupported(t),
    );
    if (!mimeType) {
      reject(new MediaPipelineError("WEBM ENCODING UNSUPPORTED"));
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement("video") as CaptureCapableVideo;
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const chunks: BlobPart[] = [];
    let recorder: MediaRecorder | null = null;
    let settled = false;

    const timeout = window.setTimeout(
      () => fail(new MediaPipelineError("VIDEO RE-ENCODE TIMED OUT")),
      (MAX_VIDEO_SECONDS + 15) * 1000,
    );

    const cleanup = () => {
      window.clearTimeout(timeout);
      if (recorder && recorder.state !== "inactive") recorder.stop();
      video.pause();
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    video.onerror = () => fail(new MediaPipelineError("VIDEO DECODE FAILED"));

    video.onloadedmetadata = async () => {
      try {
        const capture = video.captureStream ?? video.mozCaptureStream;
        if (!capture) {
          fail(new MediaPipelineError("CAPTURESTREAM UNSUPPORTED"));
          return;
        }
        const stream = capture.call(video);
        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: RE_ENCODE_VIDEO_BPS,
          audioBitsPerSecond: RE_ENCODE_AUDIO_BPS,
        });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          video.pause();
          video.removeAttribute("src");
          video.load();
          URL.revokeObjectURL(url);
          resolve(new Blob(chunks, { type: "video/webm" }));
        };
        video.onended = () => {
          if (recorder && recorder.state !== "inactive") recorder.stop();
        };
        recorder.start(250);
        await video.play();
      } catch {
        fail(new MediaPipelineError("VIDEO RE-ENCODE FAILED"));
      }
    };
  });
}
