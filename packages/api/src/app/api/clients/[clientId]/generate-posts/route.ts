import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { getClient } from "@/lib/clients";
import { generateWeekPosts, GeneratedPost } from "@/lib/postGenerator";

const DATA_DIR = path.join(process.cwd(), "..", "..", "data");
const GEN_DIR = path.join(DATA_DIR, "generated-posts");
const STATUS_DIR = path.join(DATA_DIR, "post-status");

function genFile(clientId: string, month: string, week: number) {
  return path.join(GEN_DIR, `${clientId}-${month}-w${week}.json`);
}

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

/** GET — retorna posts gerados para a semana (se existirem) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const week = parseInt(searchParams.get("week") ?? "1");

  const f = genFile(clientId, month, week);
  if (!existsSync(f)) {
    return NextResponse.json({ posts: [], generated: false });
  }

  const posts: GeneratedPost[] = JSON.parse(readFileSync(f, "utf-8"));
  const status = readStatus(clientId);

  // Mescla status salvo
  const merged = posts.map((p) => ({
    ...p,
    status: status[p.id] ?? p.status ?? "rascunho",
  }));

  return NextResponse.json({ posts: merged, generated: true });
}

/** POST — gera posts para a semana usando Claude */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const month: string = body.month ?? new Date().toISOString().slice(0, 7);
  const week: number = body.week ?? 1;

  const posts = await generateWeekPosts(client, week, month, DATA_DIR);

  // Salva posts gerados
  writeFileSync(genFile(clientId, month, week), JSON.stringify(posts, null, 2), "utf-8");

  return NextResponse.json({ ok: true, posts });
}
