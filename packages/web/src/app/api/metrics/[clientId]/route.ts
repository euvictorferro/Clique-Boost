import { NextRequest, NextResponse } from "next/server";
import { fetchClientInsights } from "@/lib/api/metaInsights";
import { getClient } from "@/lib/api/clients";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  
  const client = await getClient(clientId);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (!client.metaAccessToken) {
    return NextResponse.json(
      { error: "No Meta access token" },
      { status: 400 }
    );
  }

  // ?period=7 | 30 (Meta API não suporta >30 dias para follower_count)
  const rawPeriod = req.nextUrl.searchParams.get("period");
  const days = rawPeriod === "7" ? 7 : 30;

  try {
    const insights = await fetchClientInsights(client, days);
    return NextResponse.json(insights, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
