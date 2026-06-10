import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { readClients, upsertClient } from "@/lib/clients";
import { scrapeRecentPosts } from "@/lib/apify";

const DATA_DIR = path.join(process.cwd(), "..", "data", "competitors");

function cacheFile(clientId: string) {
  return path.join(DATA_DIR, `${clientId}.json`);
}

interface CompetitorPost {
  id: string;
  username: string;
  caption: string;
  type: string;
  url: string;
  displayUrl: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  videoViewCount?: number;
  hashtags: string[];
  scrapedAt: string;
}

interface CacheFile {
  clientId: string;
  scrapedAt: string;
  posts: CompetitorPost[];
}

function readCache(clientId: string): CacheFile | null {
  const f = cacheFile(clientId);
  if (!existsSync(f)) return null;
  try { return JSON.parse(readFileSync(f, "utf-8")); } catch { return null; }
}

function writeCache(clientId: string, posts: CompetitorPost[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const data: CacheFile = { clientId, scrapedAt: new Date().toISOString(), posts };
  writeFileSync(cacheFile(clientId), JSON.stringify(data, null, 2), "utf-8");
  return data;
}

/** Write/update concorrentes.md in Obsidian vault */
function saveToObsidian(obsidianPath: string, competitors: string[], posts: CompetitorPost[]) {
  if (!obsidianPath) return;
  try {
    const now = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    const lines: string[] = [
      `# Concorrentes`,
      ``,
      `> Atualizado em ${now} via Clique Boost App`,
      ``,
      `## Perfis Monitorados`,
      ``,
      ...competitors.map((c) => `- [@${c}](https://instagram.com/${c})`),
      ``,
    ];

    if (posts.length > 0) {
      lines.push(`## Top Posts (últimas 2 semanas)`, ``);
      // Group by username
      const byUser: Record<string, CompetitorPost[]> = {};
      for (const p of posts) {
        if (!byUser[p.username]) byUser[p.username] = [];
        byUser[p.username].push(p);
      }
      for (const [username, userPosts] of Object.entries(byUser)) {
        lines.push(`### @${username}`, ``);
        for (const p of userPosts.slice(0, 5)) {
          const date = new Date(p.timestamp).toLocaleDateString("pt-BR");
          const eng = p.likesCount + p.commentsCount;
          const views = p.videoViewCount ? ` · ${p.videoViewCount.toLocaleString("pt-BR")} views` : "";
          lines.push(
            `**[${p.type} · ${date}](${p.url})** — ${p.likesCount.toLocaleString("pt-BR")} ❤️ · ${p.commentsCount.toLocaleString("pt-BR")} 💬${views} _(${eng.toLocaleString("pt-BR")} eng.)_`,
            ``
          );
          if (p.caption) lines.push(`> ${p.caption.slice(0, 200)}`, ``);
        }
      }
    }

    writeFileSync(path.join(obsidianPath, "concorrentes.md"), lines.join("\n"), "utf-8");
  } catch { /* vault may not be mounted */ }
}

/** Extract @username from Instagram URL or plain handle */
function parseUsername(input: string): string | null {
  const cleaned = input.trim().replace(/\/$/, "");
  // URL: https://instagram.com/username or https://www.instagram.com/p/... (ignore posts)
  const urlMatch = cleaned.match(/instagram\.com\/([^/?#]+)/);
  if (urlMatch) {
    const u = urlMatch[1];
    if (["p", "reel", "stories", "explore"].includes(u)) return null;
    return u;
  }
  // @handle or plain handle
  const handle = cleaned.replace(/^@/, "");
  if (/^[a-zA-Z0-9._]{1,30}$/.test(handle)) return handle;
  return null;
}

/** GET — return cached posts + competitors list */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  const cache = readCache(clientId);

  return NextResponse.json({
    posts: cache?.posts ?? [],
    scrapedAt: cache?.scrapedAt ?? null,
    competitors: client?.competitors ?? [],
  });
}

/** PATCH — add or remove a competitor */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await req.json();
  const { action, username: raw } = body as { action: "add" | "remove"; username: string };

  const username = parseUsername(raw ?? "");
  if (!username) return NextResponse.json({ error: "Username inválido" }, { status: 400 });

  const current: string[] = client.competitors ?? [];
  let updated: string[];

  if (action === "add") {
    if (current.includes(username)) return NextResponse.json({ error: "Já adicionado" }, { status: 409 });
    updated = [...current, username];
  } else {
    updated = current.filter((c) => c !== username);
  }

  await upsertClient({ ...client, competitors: updated });

  // Update Obsidian (just the list, no posts yet)
  if (client.obsidianPath) {
    const cache = readCache(clientId);
    saveToObsidian(client.obsidianPath, updated, cache?.posts ?? []);
  }

  return NextResponse.json({ ok: true, competitors: updated });
}

/** POST — trigger fresh scrape from Apify */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const competitors: string[] = client.competitors ?? [];
  if (!competitors.length) {
    return NextResponse.json({ error: "Nenhum concorrente configurado" }, { status: 400 });
  }

  const allPosts: CompetitorPost[] = [];
  const errors: string[] = [];

  for (const username of competitors) {
    try {
      const raw = await scrapeRecentPosts(username, 12, 14);
      const mapped: CompetitorPost[] = raw.map((p: any) => ({
        id: p.id ?? p.shortCode ?? `${username}-${Date.now()}`,
        username,
        caption: (p.caption ?? p.alt ?? "").slice(0, 300),
        type: p.type ?? p.productType ?? "Image",
        url: p.url ?? `https://instagram.com/p/${p.shortCode}/`,
        displayUrl: p.displayUrl ?? p.thumbnailSrc ?? "",
        timestamp: p.timestamp ?? p.takenAtTimestamp ?? new Date().toISOString(),
        likesCount: p.likesCount ?? p.likes ?? 0,
        commentsCount: p.commentsCount ?? p.comments ?? 0,
        videoViewCount: p.videoViewCount ?? undefined,
        hashtags: p.hashtags ?? [],
        scrapedAt: new Date().toISOString(),
      }));
      allPosts.push(...mapped);
    } catch (err) {
      errors.push(`${username}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  allPosts.sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount));

  const cache = writeCache(clientId, allPosts);

  // Save to Obsidian
  if (client.obsidianPath) {
    saveToObsidian(client.obsidianPath, competitors, allPosts);
  }

  return NextResponse.json({
    ok: true,
    postsScraped: allPosts.length,
    scrapedAt: cache.scrapedAt,
    errors: errors.length ? errors : undefined,
  });
}
