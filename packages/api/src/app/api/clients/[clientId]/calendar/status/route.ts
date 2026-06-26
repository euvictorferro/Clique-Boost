import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const STATUS_DIR = path.join(process.cwd(), "..", "..", "data", "post-status");
const VALID_STATUSES = ["rascunho", "pendente", "aprovado", "publicado"];

function statusFile(clientId: string) {
  return path.join(STATUS_DIR, `${clientId}.json`);
}

function readStatus(clientId: string): Record<string, string> {
  try {
    const f = statusFile(clientId);
    if (existsSync(f)) return JSON.parse(readFileSync(f, "utf-8"));
  } catch {}
  return {};
}

/** PATCH — atualiza o status de um post */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const body = await req.json().catch(() => ({}));
  const { postId, status } = body as { postId: string; status: string };

  if (!postId || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "postId e status válido são obrigatórios" }, { status: 400 });
  }

  const current = readStatus(clientId);
  current[postId] = status;
  writeFileSync(statusFile(clientId), JSON.stringify(current, null, 2), "utf-8");

  return NextResponse.json({ ok: true, postId, status });
}

/** GET — retorna todos os status do cliente */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  return NextResponse.json(readStatus(clientId));
}
