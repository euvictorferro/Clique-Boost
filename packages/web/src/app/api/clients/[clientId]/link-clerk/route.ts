import { NextRequest, NextResponse } from "next/server";
import { updateClientField } from "@/lib/api/clients";

// POST /api/clients/:clientId/link-clerk  { clerkUserId: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const { clerkUserId } = await req.json();

  if (!clerkUserId) {
    return NextResponse.json({ error: "clerkUserId obrigatório" }, { status: 400 });
  }

  await updateClientField(clientId, { clerk_user_id: clerkUserId });
  return NextResponse.json({ ok: true });
}
