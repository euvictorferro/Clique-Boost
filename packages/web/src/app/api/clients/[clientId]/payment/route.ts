import { NextRequest, NextResponse } from "next/server";
import { getClient, updateClientField } from "@/lib/api/clients";
import { getSupabase } from "@/lib/api/supabase";

type RouteContext = { params: Promise<{ clientId: string }> };

// GET — status de pagamento + URL assinada do comprovante (1h)
export async function GET(_req: NextRequest, context: RouteContext) {
  const { clientId } = await context.params;
  const client = await getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  let proofSignedUrl: string | undefined;
  if (client.paymentProofUrl) {
    const { data } = await getSupabase()
      .storage.from("payment-proofs")
      .createSignedUrl(client.paymentProofUrl, 3600);
    proofSignedUrl = data?.signedUrl;
  }

  return NextResponse.json({
    paymentStatus: client.paymentStatus ?? "pending",
    paymentConfirmedAt: client.paymentConfirmedAt ?? null,
    proofSignedUrl: proofSignedUrl ?? null,
  });
}

// POST — confirma (ou reverte) o pagamento manualmente
export async function POST(req: NextRequest, context: RouteContext) {
  const { clientId } = await context.params;
  const client = await getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action ?? "confirm";

  if (action === "confirm") {
    await updateClientField(clientId, {
      payment_status: "confirmed",
      payment_confirmed_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, paymentStatus: "confirmed" });
  }

  if (action === "revert") {
    await updateClientField(clientId, {
      payment_status: "pending",
      payment_confirmed_at: null,
    });
    return NextResponse.json({ ok: true, paymentStatus: "pending" });
  }

  return NextResponse.json({ error: `Ação inválida: ${action}` }, { status: 400 });
}
