import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/api/clients";
import { fetchClientInsights } from "@/lib/api/metaInsights";
import { generateReportPDF, ReportData } from "@/lib/api/pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  let insights;
  try {
    insights = await fetchClientInsights(client);
  } catch {
    insights = null;
  }

  const data: ReportData = {
    clientName: client.name,
    period: "Últimos 30 dias",
    followers: insights?.followerCount ?? 0,
    followerDelta: insights?.followerGrowth ?? 0,
    reach30d: insights?.reach ?? 0,
    impressions30d: insights?.impressions ?? 0,
    engagementRate: insights?.engagementRate ?? 0,
    topPosts: (insights?.topPosts ?? []).map((p) => ({
      theme: p.mediaType,
      mediaType: p.mediaType,
      likes: p.likeCount,
      comments: p.commentsCount,
      saves: p.saves,
    })),
    demographics: insights?.demographics,
  };

  const pdfBuffer = generateReportPDF(data);
  const filename = `relatorio-${clientId}-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
