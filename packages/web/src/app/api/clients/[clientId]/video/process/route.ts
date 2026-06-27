import { NextRequest, NextResponse } from "next/server";
import { processVideo } from "@/lib/api/videoEditor";

/**
 * POST /api/clients/[clientId]/video/process
 * Body: { file: string, language?: string }
 *
 * Inicia o pipeline de edição de vídeo para um arquivo em:
 *   data/video-inbox/[clientId]/raw/[file]
 *
 * Retorna imediatamente com { ok: true } e processa em background.
 * Use GET /api/clients/[clientId]/video/status para checar progresso.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const body = await req.json().catch(() => ({}));
  const { file, language = "pt" } = body as { file?: string; language?: string };

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  // Processa em background — resposta imediata
  processVideo({ clientId, inputFile: file, language })
    .then((result) => {
      console.log(`[video/process] ${clientId}/${file}:`, result.success ? "✅ done" : "❌ " + result.error);
    })
    .catch((err) => {
      console.error(`[video/process] Unhandled error for ${clientId}/${file}:`, err);
    });

  return NextResponse.json({ ok: true, clientId, file, language });
}

/**
 * GET /api/clients/[clientId]/video/process
 * Lista os arquivos disponíveis nas pastas raw/ e ready/ do cliente.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const fs = await import("fs");
  const path = await import("path");

  const base = path.join(process.cwd(), "..", "..", "data", "video-inbox", clientId);

  function listDir(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f: string) => /\.(mp4|mov|m4v|avi|mkv)$/i.test(f));
  }

  return NextResponse.json({
    clientId,
    raw: listDir(path.join(base, "raw")),
    processing: listDir(path.join(base, "processing")),
    ready: listDir(path.join(base, "ready")),
  });
}
