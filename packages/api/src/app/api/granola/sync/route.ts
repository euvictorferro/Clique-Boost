/**
 * POST /api/granola/sync
 *
 * Receives a list of meetings (fetched by Claude via Granola MCP) and
 * upserts them into data/meetings.json.
 *
 * Claude is responsible for:
 *  1. Fetching meetings from Granola using the MCP tool
 *  2. Mapping meeting titles → clientIds (by matching client names/nicknames)
 *  3. POSTing the resulting array here
 *
 * Body: { meetings: Meeting[] }
 * Returns: { upserted: number, total: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "..", "..", "data");
const MEETINGS_FILE = path.join(DATA_DIR, "meetings.json");

interface Meeting {
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

function writeMeetings(meetings: Meeting[]): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(MEETINGS_FILE, JSON.stringify(meetings, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incoming: Meeting[] = body.meetings ?? [];

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json({ error: "No meetings provided" }, { status: 400 });
    }

    const existing = readMeetings();
    const byId = new Map(existing.map((m) => [m.id, m]));

    let upserted = 0;
    for (const meeting of incoming) {
      const prev = byId.get(meeting.id);
      // Merge: prefer incoming data, but keep existing clientIds if not provided
      byId.set(meeting.id, {
        ...prev,
        ...meeting,
        clientIds: meeting.clientIds?.length
          ? meeting.clientIds
          : prev?.clientIds ?? [],
        syncedAt: new Date().toISOString(),
      });
      upserted++;
    }

    const all = Array.from(byId.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    writeMeetings(all);
    return NextResponse.json({ upserted, total: all.length });
  } catch (err) {
    console.error("[granola/sync]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
