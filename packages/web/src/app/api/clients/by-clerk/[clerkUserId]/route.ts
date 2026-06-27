import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/api/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clerkUserId: string }> }
) {
  const { clerkUserId } = await params;

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error || !client) {
    return NextResponse.json({ client: null }, { status: 404 });
  }

  // Busca últimas métricas do cliente (opcional)
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
