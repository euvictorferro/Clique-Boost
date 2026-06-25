import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

const MEETINGS_FILE = path.join(process.cwd(), "..", "data", "meetings.json");

export interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
  clientIds: string[];
  summary: string;
  syncedAt: string;
}

function readMeetings(): Meeting[] {
  if (!existsSync(MEETINGS_FILE)) return [];
  try { return JSON.parse(readFileSync(MEETINGS_FILE, "utf-8")); } catch { return []; }
}

/**
 * GET /api/clients/[clientId]/meetings
 *
 * Returns meetings that have this client's ID in their clientIds array.
 * The clientIds are set correctly during Granola sync (Claude-side), so
 * we trust that array rather than re-parsing the title.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;

  const all = readMeetings();
  const meetings = all
    .filter((m) => m.clientIds.includes(clientId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ meetings, total: meetings.length });
}
