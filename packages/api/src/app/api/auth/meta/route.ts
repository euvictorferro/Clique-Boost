import { NextRequest, NextResponse } from "next/server";

const APP_ID = process.env.META_APP_ID!;
const REDIRECT_URI = "http://localhost:3000/api/auth/meta/callback";
const SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_read_engagement",
  "pages_show_list",
].join(",");

/** GET /api/auth/meta?clientId=tiago-zamboni
 *  Redirects to Facebook OAuth dialog */
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const url = new URL("https://www.facebook.com/dialog/oauth");
  url.searchParams.set("client_id", APP_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", clientId); // carry clientId through OAuth

  return NextResponse.redirect(url.toString());
}
