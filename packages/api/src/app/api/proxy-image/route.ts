import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy para imagens do CDN do Instagram.
 * GET /api/proxy-image?url=https://scontent-...
 *
 * Instagram CDN bloqueia requests sem Referer correto — este proxy
 * faz o fetch server-side com o Referer adequado e retorna a imagem.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  // Only allow Instagram CDN domains
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  const allowed = ["cdninstagram.com", "instagram.com", "fbcdn.net", "scontent"];
  const isAllowed = allowed.some((d) => parsed.hostname.includes(d) || parsed.hostname.endsWith(d));
  if (!isAllowed) return new NextResponse("Domain not allowed", { status: 403 });

  try {
    const res = await fetch(url, {
      headers: {
        "Referer": "https://www.instagram.com/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 }, // cache 1h
    });

    if (!res.ok) return new NextResponse("Upstream error", { status: res.status });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 502 });
  }
}
