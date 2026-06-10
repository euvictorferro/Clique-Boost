import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { readClients } from "@/lib/clients";

function readFile(filePath: string): string {
  try { return readFileSync(filePath, "utf-8"); } catch { return ""; }
}

/** Scan the client's Obsidian folder for months that have strategy files.
 *  Returns sorted array like ["2026-06", "2026-07"] — most recent first. */
function listAvailableMonths(base: string): string[] {
  const months = new Set<string>();
  try {
    const files = readdirSync(base);
    for (const file of files) {
      // Match: estrategia-conteudo-2026-06.md OR funil-organico-2026-06.md
      const m = file.match(/-((\d{4})-(\d{2}))\.md$/);
      if (m) months.add(m[1]);
    }
  } catch { /* folder may not exist yet */ }
  return Array.from(months).sort().reverse();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  const base = client.obsidianPath;
  const month = req.nextUrl.searchParams.get("month"); // e.g. "2026-06"

  // Build filenames: with month suffix if provided, else the permanent file
  const suffix = month ? `-${month}` : "";
  const strategy = readFile(path.join(base, `estrategia-conteudo${suffix}.md`))
    || (month ? readFile(path.join(base, "estrategia-conteudo.md")) : "");
  const funnel   = readFile(path.join(base, `funil-organico${suffix}.md`))
    || (month ? readFile(path.join(base, "funil-organico.md")) : "");
  const mindmap  = readFile(path.join(base, `mapa-mental${suffix}.md`))
    || (month ? readFile(path.join(base, "mapa-mental.md")) : "");

  const availableMonths = listAvailableMonths(base);
  const hasStrategy = !!(strategy || funnel || mindmap);

  return NextResponse.json({ strategy, funnel, mindmap, hasStrategy, availableMonths, month });
}
