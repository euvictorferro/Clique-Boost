import { NextRequest, NextResponse } from "next/server";
import { moveCard } from "@/lib/api/kanban";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  try {
    const { columnId, position } = await req.json();
    if (!columnId || position === undefined) {
      return NextResponse.json({ error: "columnId e position são obrigatórios" }, { status: 400 });
    }
    await moveCard(cardId, columnId, position);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
