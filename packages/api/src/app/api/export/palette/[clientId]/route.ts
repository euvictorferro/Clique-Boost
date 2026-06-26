import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { getClient } from "@/lib/clients";
import { generatePalettePDF, PalettePageData } from "@/lib/pdf";

function parsePalettes(markdown: string): PalettePageData[] {
  const pages: PalettePageData[] = [];
  const blocks = markdown.split(/^## /m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const header = lines[0] ?? "";
    const nameMatch = header.match(/Op[çc][aã]o\s+\d+\s*[—\-]\s*(.+)/i);
    if (!nameMatch) continue;

    const paletteName = nameMatch[1].trim();
    const colors: Array<{ label: string; hex: string }> = [];

    for (const line of lines.slice(1)) {
      const colorMatch = line.match(/[-*]\s*(.+?):\s*(#[0-9a-fA-F]{6})/);
      if (colorMatch) {
        colors.push({ label: colorMatch[1].trim(), hex: colorMatch[2] });
      }
    }

    if (colors.length > 0) pages.push({ clientName: "", paletteName, colors });
  }

  return pages;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  let markdown = "";
  try {
    markdown = readFileSync(path.join(client.obsidianPath, "paleta.md"), "utf-8");
  } catch {
    return NextResponse.json({ error: "paleta.md not found" }, { status: 404 });
  }

  const pages = parsePalettes(markdown).map((p) => ({
    ...p,
    clientName: client.name,
  }));

  if (!pages.length) {
    return NextResponse.json({ error: "No palettes found" }, { status: 404 });
  }

  const pdfBuffer = generatePalettePDF(pages, client.brandName || client.name);
  const filename = `paletas-${clientId}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
