import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("supabase_user_id", userId)
    .single();

  if (error || !client) {
    return NextResponse.json({ client: null }, { status: 404 });
  }

  const { data: insightsRow } = await supabase
    .from("pipeline_logs")
    .select("details")
    .eq("client_id", client.id)
    .eq("job", "meta")
    .eq("status", "success")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ client, insights: insightsRow?.details ?? null });
}
