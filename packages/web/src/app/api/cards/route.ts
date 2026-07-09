import { NextRequest, NextResponse } from "next/server";
import { createCard } from "@/lib/api/kanban";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { columnId, boardId, ...fields } = body;
    if (!columnId || !boardId || !fields.title) {
      return NextResponse.json({ error: "columnId, boardId e title são obrigatórios" }, { status: 400 });
    }
    const card = await createCard(columnId, boardId, fields);
    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
