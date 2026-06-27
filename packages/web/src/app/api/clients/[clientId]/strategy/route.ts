import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/api/clients";
import { readNoteAsync } from "@/lib/api/obsidian";
import { supabase } from "@/lib/api/supabase";

async function listAvailableMonths(clientId: string): Promise<string[]> {
  const { data } = await supabase
    .from("client_documents")
    .select("month")
    .eq("client_id", clientId)
    .eq("doc_type", "calendar")
    .not("month", "is", null)
    .order("month", { ascending: false });
  return (data ?? []).map((r: { month: string }) => r.month).filter(Boolean);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [strategy, funnel, mindmap, availableMonths] = await Promise.all([
    readNoteAsync(clientId, "estrategia-conteudo.md").then(v => v ?? ""),
    readNoteAsync(clientId, "funil-organico.md").then(v => v ?? ""),
    readNoteAsync(clientId, "mapa-mental.md").then(v => v ?? ""),
    listAvailableMonths(clientId),
  ]);

  const hasStrategy = !!(strategy || funnel || mindmap);

  return NextResponse.json({ strategy, funnel, mindmap, hasStrategy, availableMonths, month: null });
}
