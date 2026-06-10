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
 * Returns only meetings whose title explicitly includes the client's name
 * (e.g. "Sam x Clique Boost", "Bela x Clique Boost").
 * This ensures internal team meetings don't appear in client profiles.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;

  // Build name variants to search in the title
  // e.g. clientId "sam-fernandes" → "sam"
  // We also read the stored client name for full-name matching
  const nameParts = clientId.split("-").map((p) => p.toLowerCase());
  const firstNameSlug = nameParts[0]; // e.g. "sam", "bela", "lais", "tiago"

  const all = readMeetings();
  const meetings = all
    .filter((m) => {
      const titleLower = m.title.toLowerCase();
      // Must mention the client name in the title
      return (
        m.clientIds.includes(clientId) &&
        (titleLower.includes(firstNameSlug) ||
          nameParts.some((part) => part.length > 3 && titleLower.includes(part)))
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ meetings, total: meetings.length });
}
