import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { getClient } from "@/lib/clients";

export interface ColorSwatch {
  hex: string;
  name: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId) as any;
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Structured swatches from clients.json (populated from brand PDFs)
  let swatches: ColorSwatch[] = [];
  if (client.brandColors) {
    const hexes = client.brandColors.split(",").map((h: string) => h.trim());
    const names = (client.paletteNames ?? "").split(",").map((n: string) => n.trim());
    swatches = hexes.map((hex: string, i: number) => ({ hex, name: names[i] ?? hex }));
  }

  // Markdown content from Obsidian paleta.md
  let content = "";
  try {
    const { readNote } = await import("@/lib/obsidian");
    content = readNote(clientId, "paleta.md") ?? "";
  } catch { /* ignore */ }

  return NextResponse.json({ content, swatches });
}
