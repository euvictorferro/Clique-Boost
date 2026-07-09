import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/api/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const plans = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    includesOrganic: row.includes_organic,
    includesPaidAds: row.includes_paid_ads,
    includesVideo: row.includes_video,
    monthlyPrice: row.monthly_price ?? undefined,
    trackedMetrics: row.tracked_metrics ?? [],
    active: row.active,
  }));

  return NextResponse.json({ plans });
}
