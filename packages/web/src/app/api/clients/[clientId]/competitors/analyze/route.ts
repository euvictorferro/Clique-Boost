import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { getClient } from "@/lib/api/clients";
import Anthropic from "@anthropic-ai/sdk";
import { transcribeVideo, fetchImageAsBase64 } from "@/lib/api/transcribe";

const DATA_DIR = path.join(process.cwd(), "..", "..", "data", "competitors");

function cacheFile(clientId: string) {
  return path.join(DATA_DIR, `${clientId}.json`);
}

function readCache(clientId: string): any {
  const f = cacheFile(clientId);
  if (!existsSync(f)) return null;
  try { return JSON.parse(readFileSync(f, "utf-8")); } catch { return null; }
}

function writeCache(clientId: string, data: any) {
  writeFileSync(cacheFile(clientId), JSON.stringify(data, null, 2), "utf-8");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function analyzePost(post: any, client: any): Promise<string> {
  const engagement = post.likesCount + post.commentsCount;
  const views = post.videoViewCount ? `${post.videoViewCount.toLocaleString()} views` : "";
  const isVideo = post.type === "Video" || post.type === "Reel";

  // 1. Fetch thumbnail as base64 for Claude vision
  const thumbnail = post.displayUrl
    ? await fetchImageAsBase64(post.displayUrl)
    : null;

  // 2. Transcribe video if available
  let transcript: string | null = null;
  if (isVideo && post.videoUrl) {
    console.log(`[analyze] Transcribing video for post ${post.id}...`);
    transcript = await transcribeVideo(post.videoUrl);
  }

  const nicheLabel =
    client.niche === "life-insurance"
      ? "Life Insurance"
      : client.niche === "real-estate"
      ? "mercado imobiliário"
      : "marketing digital";

  const promptText = `Você é um estrategista de conteúdo especializado em ${nicheLabel}.

Analise este post de um concorrente e explique por que ele funcionou bem, e como ${client.name} (${client.brandName ?? client.name}) pode se INSPIRAR (sem copiar) para criar algo ainda melhor, adaptado à voz e ao público deles.

**Post analisado:**
- Concorrente: @${post.username}
- Formato: ${post.type}
- Engajamento: ${engagement.toLocaleString()} (${post.likesCount.toLocaleString()} ❤️ + ${post.commentsCount.toLocaleString()} 💬${views ? " · " + views : ""})
- Caption: "${post.caption.slice(0, 400)}"
- Hashtags: ${post.hashtags.slice(0, 5).join(", ")}${
    transcript ? `\n- Transcrição do vídeo: "${transcript.slice(0, 600)}"` : ""
  }

**Contexto do cliente:**
- Nome: ${client.name}
- Tom de voz: ${client.toneOfVoice || "Profissional e próximo"}
- Objetivo: ${client.contentGoal || "Gerar leads qualificados"}

${thumbnail ? "A thumbnail/capa do post está anexada acima para análise visual." : ""}

Responda em **3 blocos curtos** (máximo 2 linhas cada):
1. **Por que funcionou** — o que fez esse post performar bem (considere visual, áudio e texto)
2. **O gancho** — qual a estrutura de abertura que prende atenção
3. **Como adaptar** — como ${client.name} pode usar essa ideia com a própria voz e contexto

Seja direto, prático e específico. Sem introduções.`;

  // Build message content — add thumbnail image if available
  const messageContent: Anthropic.MessageParam["content"] = [];

  if (thumbnail) {
    messageContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: thumbnail.mediaType,
        data: thumbnail.data,
      },
    });
  }

  messageContent.push({ type: "text", text: promptText });

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 500,
    messages: [{ role: "user", content: messageContent }],
  });

  return (msg.content[0] as any).text as string;
}

/**
 * POST /api/clients/[clientId]/competitors/analyze
 * Body: { postId: string }  — analyze a single post
 * Body: { all: true }       — analyze top 5 posts by engagement
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const cache = readCache(clientId);
  if (!cache?.posts?.length) {
    return NextResponse.json({ error: "No posts to analyze" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { postId, all } = body as { postId?: string; all?: boolean };

  let targets: any[];
  if (all) {
    targets = [...cache.posts]
      .sort((a: any, b: any) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount))
      .filter((p: any) => !p.analysis)
      .slice(0, 5);
  } else if (postId) {
    targets = cache.posts.filter((p: any) => p.id === postId);
  } else {
    return NextResponse.json({ error: "Provide postId or all:true" }, { status: 400 });
  }

  if (!targets.length) {
    return NextResponse.json({ ok: true, analyzed: 0, message: "Nothing new to analyze" });
  }

  let analyzed = 0;
  for (const post of targets) {
    try {
      const analysis = await analyzePost(post, client);
      const idx = cache.posts.findIndex((p: any) => p.id === post.id);
      if (idx !== -1) {
        cache.posts[idx].analysis = analysis;
        analyzed++;
      }
    } catch (err) {
      console.error(`[analyze] Failed for post ${post.id}:`, err);
    }
  }

  writeCache(clientId, cache);

  return NextResponse.json({ ok: true, analyzed });
}
