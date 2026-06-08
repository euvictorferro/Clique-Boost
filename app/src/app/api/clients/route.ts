import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

const CLIENTS_PATH = path.join(process.cwd(), "..", "data", "clients.json");

export async function GET() {
  try {
    const raw = readFileSync(CLIENTS_PATH, "utf-8");
    const clients = JSON.parse(raw);
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
