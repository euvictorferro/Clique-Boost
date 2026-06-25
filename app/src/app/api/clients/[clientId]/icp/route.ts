import { NextRequest, NextResponse } from "next/server";
import { readClients } from "@/lib/clients";
import { readNote, writeNote } from "@/lib/obsidian";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  const content = readNote(clientId, "ICP.md") ?? "";
  return NextResponse.json({ content });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const { content } = body;
  if (typeof content !== "string") {
    return NextResponse.json({ error: "content must be a string" }, { status: 400 });
  }

  try {
    writeNote(clientId, "ICP.md", content);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Write failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
