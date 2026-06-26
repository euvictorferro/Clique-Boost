/**
 * transcribe.ts
 *
 * Downloads a video from a URL, extracts audio with ffmpeg,
 * uploads to Gemini Files API, and returns a transcript.
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync, readFileSync } from "fs";
import path from "path";
import os from "os";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(key);
}

/** Download a URL to a temp file. Returns the temp file path. */
async function downloadToTemp(url: string, ext: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const tmpPath = path.join(os.tmpdir(), `cb-video-${Date.now()}${ext}`);
  writeFileSync(tmpPath, buf);
  return tmpPath;
}

/** Use ffmpeg to extract audio as mp3 from a video file. */
function extractAudio(videoPath: string): string {
  const audioPath = videoPath.replace(/\.[^.]+$/, ".mp3");
  execSync(
    `ffmpeg -y -i "${videoPath}" -vn -acodec libmp3lame -q:a 4 "${audioPath}"`,
    { stdio: "pipe", timeout: 60_000 }
  );
  return audioPath;
}

/**
 * Transcribe a video from a CDN URL using Gemini.
 * Returns the transcript string, or null if it fails.
 */
export async function transcribeVideo(videoUrl: string): Promise<string | null> {
  const videoPath = await downloadToTemp(videoUrl, ".mp4");
  let audioPath: string | null = null;

  try {
    // Extract audio
    audioPath = extractAudio(videoPath);

    // Upload to Gemini Files API
    const gemini = getGemini();
    const audioBytes = readFileSync(audioPath);

    // Use inline data approach (for files < 20MB)
    const audioBase64 = audioBytes.toString("base64");
    const fileSizeMB = audioBytes.length / (1024 * 1024);

    let transcript: string;

    if (fileSizeMB < 18) {
      // Inline base64 for small files
      const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "audio/mp3",
            data: audioBase64,
          },
        },
        "Transcreva o áudio deste vídeo do Instagram. Retorne APENAS a transcrição, sem comentários, introduções ou explicações. Se não houver fala, retorne '[sem narração]'.",
      ]);
      transcript = result.response.text() ?? "[sem narração]";
    } else {
      // File too big — skip transcription
      transcript = "[vídeo muito longo para transcrição]";
    }

    return transcript.trim();
  } catch (err) {
    console.error("[transcribe] Error:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    // Clean up temp files
    try { if (existsSync(videoPath)) unlinkSync(videoPath); } catch {}
    try { if (audioPath && existsSync(audioPath)) unlinkSync(audioPath); } catch {}
  }
}

/** Fetch an image URL and return base64 + mediaType for Claude vision. */
export async function fetchImageAsBase64(
  url: string
): Promise<{ data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    const mediaType = ct.includes("png")
      ? "image/png"
      : ct.includes("webp")
      ? "image/webp"
      : "image/jpeg";
    return { data: buf.toString("base64"), mediaType };
  } catch {
    return null;
  }
}
