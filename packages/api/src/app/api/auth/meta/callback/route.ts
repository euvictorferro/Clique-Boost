import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const APP_ID     = process.env.META_APP_ID!;
const APP_SECRET = process.env.META_APP_SECRET!;
const REDIRECT_URI = "http://localhost:3000/api/auth/meta/callback";
const CLIENTS_PATH = path.join(process.cwd(), "..", "..", "data", "clients.json");

async function exchangeCode(code: string): Promise<{ access_token: string; expires_in?: number }> {
  const url = new URL("https://graph.facebook.com/v25.0/oauth/access_token");
  url.searchParams.set("client_id", APP_ID);
  url.searchParams.set("client_secret", APP_SECRET);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function toLongLived(shortToken: string): Promise<{ access_token: string; expires_in: number }> {
  const url = new URL("https://graph.facebook.com/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", APP_ID);
  url.searchParams.set("client_secret", APP_SECRET);
  url.searchParams.set("fb_exchange_token", shortToken);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function saveToken(clientId: string, token: string, expiresIn: number) {
  const raw = readFileSync(CLIENTS_PATH, "utf-8");
  const clients = JSON.parse(raw);
  const idx = clients.findIndex((c: { id: string }) => c.id === clientId);
  if (idx === -1) throw new Error(`Client ${clientId} not found`);

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  clients[idx].metaAccessToken = token;
  clients[idx].metaTokenExpiresAt = expiresAt;
  writeFileSync(CLIENTS_PATH, JSON.stringify(clients, null, 2), "utf-8");
  return expiresAt;
}

export async function GET(req: NextRequest) {
  const code     = req.nextUrl.searchParams.get("code");
  const clientId = req.nextUrl.searchParams.get("state"); // we stored clientId in state
  const error    = req.nextUrl.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      `http://localhost:3000/clients/${clientId}/settings?meta_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !clientId) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    // 1. Exchange code → short-lived token
    const { access_token: shortToken } = await exchangeCode(code);

    // 2. Convert → long-lived token (60 days)
    const { access_token: longToken, expires_in } = await toLongLived(shortToken);

    // 3. Save to clients.json
    saveToken(clientId, longToken, expires_in ?? 5184000); // default 60d

    // 4. Redirect back to settings with success flag
    return NextResponse.redirect(
      `http://localhost:3000/clients/${clientId}/settings?meta_connected=1`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      `http://localhost:3000/clients/${clientId}/settings?meta_error=${encodeURIComponent(msg)}`
    );
  }
}
