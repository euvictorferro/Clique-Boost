import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { readClients } from "@/lib/clients";

function icpPath(obsidianPath: string) {
  return path.join(obsidianPath, "ICP.md");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const content = readFileSync(icpPath(client.obsidianPath), "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ content: "" });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { content } = await req.json();
  writeFileSync(icpPath(client.obsidianPath), content, "utf-8");
  return NextResponse.json({ ok: true });
}
