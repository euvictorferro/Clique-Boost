import { NextRequest, NextResponse } from "next/server";
import { readClients } from "@/lib/clients";
import { readNote, getClientPath } from "@/lib/obsidian";
import { readdirSync } from "fs";
import path from "path";

function listAvailableMonths(clientId: string): string[] {
  const months = new Set<string>();
  try {
    const estrategiaDir = path.join(getClientPath(clientId), "Estratégia");
    const files = readdirSync(estrategiaDir);
    for (const file of files) {
      const m = file.match(/-((\d{4})-(\d{2}))\.md$/);
      if (m) months.add(m[1]);
    }
  } catch { /* pasta pode não existir ainda */ }
  return Array.from(months).sort().reverse();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  const strategy = readNote(clientId, "estrategia-conteudo.md") ?? "";
  const funnel   = readNote(clientId, "funil-organico.md") ?? "";
  const mindmap  = readNote(clientId, "mapa-mental.md") ?? "";

  const availableMonths = listAvailableMonths(clientId);
  const hasStrategy = !!(strategy || funnel || mindmap);

  return NextResponse.json({ strategy, funnel, mindmap, hasStrategy, availableMonths, month: null });
}
