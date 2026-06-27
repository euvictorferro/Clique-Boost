import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const CLIENTS_PATH = path.join(process.cwd(), "..", "..", "data", "clients.json");

export async function PATCH(req: Request) {
  try {
    const updated = await req.json();
    const raw = readFileSync(CLIENTS_PATH, "utf-8");
    const clients = JSON.parse(raw);
    const idx = clients.findIndex((c: { id: string }) => c.id === updated.id);
    if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
    clients[idx] = { ...clients[idx], ...updated };
    writeFileSync(CLIENTS_PATH, JSON.stringify(clients, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const raw = readFileSync(CLIENTS_PATH, "utf-8");
    const clients = JSON.parse(raw);
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
