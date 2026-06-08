import { NextRequest, NextResponse } from "next/server";
import { fetchClientInsights } from "@/lib/metaInsights";
import { readClients } from "@/lib/clients";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const clients = readClients();
  const client = clients.find((c) => c.id === clientId);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (!client.metaAccessToken) {
    return NextResponse.json(
      { error: "No Meta access token" },
      { status: 400 }
    );
  }

  try {
    const insights = await fetchClientInsights(client);
    return NextResponse.json(insights, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
