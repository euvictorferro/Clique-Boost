/**
 * videoEditor.ts
 * Pipeline completo de edição automática de Reels:
 *   1. Auto-cut (remove silêncios)
 *   2. Legendas estilo Netflix (Whisper → SRT → burn)
 *   3. Montagem final (intro + vídeo + outro + música)
 */

import { execSync, exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { transcribeVideo } from "./whisper";
import { readClients } from "./clients";

const execAsync = promisify(exec);

const DATA_DIR = path.join(process.cwd(), "..", "..", "data");
const ASSETS_DIR = path.join(DATA_DIR, "video-assets");
const INBOX_DIR = path.join(DATA_DIR, "video-inbox");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ffmpeg(cmd: string): Promise<{ stdout: string; stderr: string }> {
  console.log(`[ffmpeg] ${cmd.slice(0, 120)}...`);
  return execAsync(`ffmpeg -y ${cmd}`, { maxBuffer: 100 * 1024 * 1024 });
}

function clientDir(clientId: string) {
  return path.join(INBOX_DIR, clientId);
}

function processingPath(clientId: string, filename: string) {
  return path.join(clientDir(clientId), "processing", filename);
}

function readyPath(clientId: string, filename: string) {
  return path.join(clientDir(clientId), "ready", filename);
}

/** Retorna nicho do cliente para escolher a música */
async function getClientNiche(clientId: string): Promise<string> {
  const clients = readClients();
  const client = clients.find((c) => c.id === clientId);
  return client?.niche ?? "general";
}

/** Escolhe música aleatória da pasta do nicho */
function pickMusic(niche: string): string | null {
  const folder =
    niche === "real-estate"
      ? path.join(ASSETS_DIR, "music", "real-estate")
      : path.join(ASSETS_DIR, "music", "life-insurance");

  if (!fs.existsSync(folder)) return null;
  const files = fs.readdirSync(folder).filter((f) => /\.(mp3|m4a|wav|aac)$/i.test(f));
  if (files.length === 0) return null;
  return path.join(folder, files[Math.floor(Math.random() * files.length)]);
}

/** Retorna path do intro/outro do cliente, ou null se não existir */
function getAsset(type: "intros" | "outros", clientId: string): string | null {
  const dir = path.join(ASSETS_DIR, type);
  if (!fs.existsSync(dir)) return null;
  const exts = [".mp4", ".mov", ".m4v"];
  for (const ext of exts) {
    const p = path.join(dir, `${clientId}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ─── Step 1: Auto-cut silêncios ───────────────────────────────────────────────

/**
 * Remove silêncios do vídeo usando silencedetect do FFmpeg.
 * Mantém apenas segmentos com áudio acima de -35dB por >0.4s.
 */
export async function autocut(inputPath: string, outputPath: string): Promise<void> {
  console.log("[videoEditor] Step 1: Auto-cut silêncios...");

  // Detecta silêncios
  const { stderr } = await execAsync(
    `ffmpeg -i "${inputPath}" -af silencedetect=noise=-35dB:d=0.4 -f null - 2>&1`,
    { maxBuffer: 10 * 1024 * 1024 }
  );

  // Parseia os intervalos de silêncio
  const silenceStarts = [...stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) =>
    parseFloat(m[1])
  );
  const silenceEnds = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) =>
    parseFloat(m[1])
  );

  // Obtém duração total
  const durationMatch = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const totalDuration = durationMatch
    ? parseInt(durationMatch[1]) * 3600 +
      parseInt(durationMatch[2]) * 60 +
      parseFloat(durationMatch[3])
    : 0;

  if (silenceStarts.length === 0 || totalDuration === 0) {
    // Sem silêncios detectados — copia direto
    fs.copyFileSync(inputPath, outputPath);
    console.log("[videoEditor] Sem silêncios detectados, vídeo copiado.");
    return;
  }

  // Constrói lista de segmentos com áudio
  const segments: Array<{ start: number; end: number }> = [];
  let cursor = 0;

  for (let i = 0; i < silenceStarts.length; i++) {
    const silStart = silenceStarts[i];
    const silEnd = silenceEnds[i] ?? totalDuration;

    if (silStart - cursor > 0.1) {
      segments.push({ start: cursor, end: silStart });
    }
    cursor = silEnd;
  }

  // Segmento final após último silêncio
  if (totalDuration - cursor > 0.1) {
    segments.push({ start: cursor, end: totalDuration });
  }

  if (segments.length === 0) {
    fs.copyFileSync(inputPath, outputPath);
    return;
  }

  // Gera filtro de concat
  const filterParts = segments
    .map((s, i) => `[0:v]trim=${s.start}:${s.end},setpts=PTS-STARTPTS[v${i}];` +
      `[0:a]atrim=${s.start}:${s.end},asetpts=PTS-STARTPTS[a${i}]`)
    .join(";");

  const concatInputs = segments.map((_, i) => `[v${i}][a${i}]`).join("");
  const filterComplex = `${filterParts};${concatInputs}concat=n=${segments.length}:v=1:a=1[outv][outa]`;

  await ffmpeg(
    `-i "${inputPath}" -filter_complex "${filterComplex}" -map "[outv]" -map "[outa]" ` +
    `-c:v libx264 -preset fast -crf 23 -c:a aac "${outputPath}"`
  );

  console.log(`[videoEditor] Auto-cut: ${segments.length} segmentos mantidos.`);
}

// ─── Step 2: Legendas Netflix ─────────────────────────────────────────────────

/**
 * Queima legendas estilo Netflix no vídeo.
 * Fonte: Arial Bold, branca, outline preto, posição bottom center.
 */
export async function burnCaptions(
  inputPath: string,
  srtPath: string,
  outputPath: string
): Promise<void> {
  console.log("[videoEditor] Step 2: Queimando legendas...");

  // Estilo Netflix: fonte grande, bold, branca, outline preto sólido
  const subtitleStyle = [
    "FontName=Arial",
    "FontSize=22",
    "PrimaryColour=&H00FFFFFF",   // branco
    "OutlineColour=&H00000000",   // outline preto
    "BackColour=&H80000000",      // fundo semitransparente
    "Bold=1",
    "Outline=2",
    "Shadow=1",
    "Alignment=2",                // bottom center
    "MarginV=60",
  ].join(",");

  // Escapa path para FFmpeg (barras e dois-pontos)
  const escapedSrt = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");

  await ffmpeg(
    `-i "${inputPath}" ` +
    `-vf "subtitles='${escapedSrt}':force_style='${subtitleStyle}'" ` +
    `-c:v libx264 -preset fast -crf 22 -c:a copy "${outputPath}"`
  );

  console.log("[videoEditor] Legendas queimadas.");
}

// ─── Step 3: Montagem final ───────────────────────────────────────────────────

/**
 * Concatena intro + vídeo + outro e adiciona música de fundo.
 */
export async function assembleFinal(
  videoPath: string,
  clientId: string,
  outputPath: string
): Promise<void> {
  console.log("[videoEditor] Step 3: Montagem final...");

  const niche = await getClientNiche(clientId);
  const introPath = getAsset("intros", clientId);
  const outroPath = getAsset("outros", clientId);
  const musicPath = pickMusic(niche);

  const tmpDir = path.dirname(outputPath);
  const concatList = path.join(tmpDir, "concat_list.txt");

  // Se não tem intro nem outro, só adiciona música
  if (!introPath && !outroPath) {
    if (!musicPath) {
      fs.copyFileSync(videoPath, outputPath);
      console.log("[videoEditor] Sem assets — vídeo copiado sem música.");
      return;
    }

    // Adiciona só música
    await addMusic(videoPath, musicPath, outputPath);
    return;
  }

  // Normaliza todos os segmentos para o mesmo formato
  const segments: string[] = [];

  if (introPath) {
    const normIntro = path.join(tmpDir, "norm_intro.mp4");
    await normalizeClip(introPath, normIntro);
    segments.push(normIntro);
  }

  const normVideo = path.join(tmpDir, "norm_main.mp4");
  await normalizeClip(videoPath, normVideo);
  segments.push(normVideo);

  if (outroPath) {
    const normOutro = path.join(tmpDir, "norm_outro.mp4");
    await normalizeClip(outroPath, normOutro);
    segments.push(normOutro);
  }

  // Cria lista de concat
  const listContent = segments.map((s) => `file '${s}'`).join("\n");
  fs.writeFileSync(concatList, listContent);

  const concatOutput = path.join(tmpDir, "concat_tmp.mp4");
  await ffmpeg(
    `-f concat -safe 0 -i "${concatList}" -c:v libx264 -preset fast -crf 22 -c:a aac "${concatOutput}"`
  );

  // Adiciona música se disponível
  if (musicPath) {
    await addMusic(concatOutput, musicPath, outputPath);
  } else {
    fs.renameSync(concatOutput, outputPath);
  }

  // Limpa temporários
  for (const seg of segments) {
    try { fs.unlinkSync(seg); } catch {}
  }
  try { fs.unlinkSync(concatList); } catch {}
  if (fs.existsSync(concatOutput)) try { fs.unlinkSync(concatOutput); } catch {}

  console.log("[videoEditor] Montagem final concluída.");
}

/** Normaliza um clipe para 1080x1920 (vertical Reel), 30fps, aac */
async function normalizeClip(inputPath: string, outputPath: string): Promise<void> {
  await ffmpeg(
    `-i "${inputPath}" ` +
    `-vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,fps=30" ` +
    `-c:v libx264 -preset fast -crf 22 -c:a aac -ar 44100 -ac 2 "${outputPath}"`
  );
}

/** Adiciona música de fundo com volume baixo (-20dB abaixo da voz) */
async function addMusic(
  videoPath: string,
  musicPath: string,
  outputPath: string
): Promise<void> {
  const { stderr } = await execAsync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`);
  const duration = parseFloat(stderr.trim() || "60");

  await ffmpeg(
    `-i "${videoPath}" -stream_loop -1 -i "${musicPath}" ` +
    `-filter_complex "[1:a]volume=0.12,afade=t=out:st=${Math.max(0, duration - 2)}:d=2[music];[0:a][music]amix=inputs=2:duration=first:weights=1 0.12[outa]" ` +
    `-map 0:v -map "[outa]" -c:v copy -c:a aac -shortest "${outputPath}"`
  );
}

// ─── Pipeline principal ───────────────────────────────────────────────────────

export interface VideoJob {
  clientId: string;
  inputFile: string;   // nome do arquivo em video-inbox/[clientId]/raw/
  language?: string;
}

export interface VideoJobResult {
  success: boolean;
  outputFile?: string;
  outputPath?: string;
  error?: string;
  steps: string[];
}

/**
 * Executa o pipeline completo para um vídeo bruto.
 * 1. Auto-cut silêncios
 * 2. Transcrição Whisper
 * 3. Burn legendas Netflix
 * 4. Montagem (intro + vídeo + outro + música)
 */
export async function processVideo(job: VideoJob): Promise<VideoJobResult> {
  const { clientId, inputFile, language = "pt" } = job;
  const steps: string[] = [];

  const rawPath = path.join(clientDir(clientId), "raw", inputFile);
  if (!fs.existsSync(rawPath)) {
    return { success: false, error: `Arquivo não encontrado: ${rawPath}`, steps };
  }

  const baseName = path.parse(inputFile).name;
  const procDir = path.join(clientDir(clientId), "processing");

  try {
    // Step 1: Auto-cut
    const cutPath = processingPath(clientId, `${baseName}_cut.mp4`);
    await autocut(rawPath, cutPath);
    steps.push("✅ Auto-cut: silêncios removidos");

    // Step 2: Transcrição
    const { srtPath } = await transcribeVideo(cutPath, language);
    steps.push("✅ Transcrição: legendas geradas");

    // Step 3: Burn captions
    const captionedPath = processingPath(clientId, `${baseName}_captioned.mp4`);
    await burnCaptions(cutPath, srtPath, captionedPath);
    steps.push("✅ Legendas: queimadas no vídeo");

    // Step 4: Montagem final
    const outputFile = `${baseName}_final.mp4`;
    const finalPath = readyPath(clientId, outputFile);
    await assembleFinal(captionedPath, clientId, finalPath);
    steps.push("✅ Montagem: intro + vídeo + outro + música");

    // Limpa processamento
    try { fs.unlinkSync(cutPath); } catch {}
    try { fs.unlinkSync(captionedPath); } catch {}
    try { fs.unlinkSync(srtPath); } catch {}

    return {
      success: true,
      outputFile,
      outputPath: finalPath,
      steps,
    };
  } catch (err: any) {
    console.error("[videoEditor] Erro no pipeline:", err);
    return {
      success: false,
      error: err.message ?? String(err),
      steps,
    };
  }
}
