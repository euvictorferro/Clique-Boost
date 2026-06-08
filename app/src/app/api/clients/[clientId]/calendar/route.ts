import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { readClients } from "@/lib/clients";

const CALENDARS_PATH =
  "/Users/victorferro/Library/Mobile Documents/iCloud~md~obsidian/Documents/[Clique Boost] - Second Brain/03 - Calendários";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const filename = `${clientId}-${month}.md`;
    const content = readFileSync(path.join(CALENDARS_PATH, filename), "utf-8");
    return NextResponse.json({ content, month });
  } catch {
    return NextResponse.json({ content: "", month });
  }
}
