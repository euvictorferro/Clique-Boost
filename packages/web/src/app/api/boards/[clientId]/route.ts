import { NextRequest, NextResponse } from "next/server";
import { getOrCreateBoard } from "@/lib/api/kanban";
import { getClient } from "@/lib/api/clients";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  try {
    const client = await getClient(clientId);
    if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    const board = await getOrCreateBoard(clientId, client.name);
    return NextResponse.json(board);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
