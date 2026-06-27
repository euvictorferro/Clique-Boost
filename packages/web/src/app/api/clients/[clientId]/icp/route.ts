import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/api/clients";
import { readNoteAsync, writeNote } from "@/lib/api/obsidian";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  const content = await readNoteAsync(clientId, "ICP.md") ?? "";
  return NextResponse.json({ content });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
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
