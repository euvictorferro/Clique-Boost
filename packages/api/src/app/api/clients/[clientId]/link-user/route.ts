import { NextRequest, NextResponse } from "next/server";
import { updateClientField } from "@/lib/clients";

// POST /api/clients/:clientId/link-user  { supabaseUserId: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const { supabaseUserId } = await req.json();

  if (!supabaseUserId) {
    return NextResponse.json({ error: "supabaseUserId obrigatório" }, { status: 400 });
  }

  await updateClientField(clientId, { supabase_user_id: supabaseUserId });
  return NextResponse.json({ ok: true });
}
