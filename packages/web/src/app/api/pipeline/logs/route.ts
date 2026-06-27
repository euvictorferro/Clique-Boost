import { NextResponse } from "next/server";
import { readLog } from "@/lib/api/pipelineLog";

export async function GET() {
  const log = readLog();
  return NextResponse.json(log);
}
