import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { readClients } from "@/lib/clients";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const raw = readFileSync(
      path.join(client.obsidianPath, "paleta.md"),
      "utf-8"
    );
    return NextResponse.json({ content: raw });
  } catch {
    return NextResponse.json({ content: "" });
  }
}
