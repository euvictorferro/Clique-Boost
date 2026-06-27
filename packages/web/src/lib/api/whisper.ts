/**
 * whisper.ts
 * Transcrição de áudio via OpenAI Whisper API.
 * Retorna um arquivo SRT com timestamps por segmento.
 */

import fs from "fs";
import path from "path";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
  });
}

/** Converte segundos para formato SRT: 00:00:01,000 */
function toSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

/** Quebra texto em linhas de no máximo maxWords palavras */
function wrapWords(text: string, maxWords = 8): string {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    lines.push(words.slice(i, i + maxWords).join(" "));
  }
  // Máximo 2 linhas por bloco
  return lines.slice(0, 2).join("\n");
}

export interface TranscriptionResult {
  srtPath: string;
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
}

/**
 * Transcreve um arquivo de vídeo/áudio e gera um .srt no mesmo diretório.
 * @param videoPath  Caminho absoluto do arquivo de vídeo
 * @param language   "pt" (padrão) ou "en"
 */
export async function transcribeVideo(
  videoPath: string,
  language = "pt"
): Promise<TranscriptionResult> {
  console.log(`[whisper] Transcrevendo: ${path.basename(videoPath)}`);

  const fileStream = fs.createReadStream(videoPath);

  const response = await getOpenAI().audio.transcriptions.create({
    file: fileStream as any,
    model: "whisper-1",
    language,
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const segments = (response as any).segments ?? [];

  // Gera SRT
  let srt = "";
  let idx = 1;
  for (const seg of segments) {
    const text = wrapWords(seg.text.trim());
    if (!text) continue;
    srt += `${idx}\n`;
    srt += `${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n`;
    srt += `${text}\n\n`;
    idx++;
  }

  const srtPath = videoPath.replace(/\.[^.]+$/, ".srt");
  fs.writeFileSync(srtPath, srt, "utf-8");
  console.log(`[whisper] SRT salvo: ${path.basename(srtPath)} (${idx - 1} blocos)`);

  return {
    srtPath,
    text: (response as any).text ?? "",
    segments,
  };
}
