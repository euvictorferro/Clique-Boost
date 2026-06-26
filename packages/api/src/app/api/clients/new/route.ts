import { NextRequest, NextResponse } from "next/server";
import { upsertClient, getClient, slugify } from "@/lib/clients";
import { writeNoteAsync } from "@/lib/obsidian";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, brandName, niche, instagramHandle, toneOfVoice, contentGoal } = body;

  if (!name || !niche) {
    return NextResponse.json({ error: "name e niche são obrigatórios" }, { status: 400 });
  }

  const id = slugify(name);
  const existing = await getClient(id);
  if (existing) {
    return NextResponse.json({ error: `Cliente "${id}" já existe` }, { status: 409 });
  }

  const client = {
    id,
    name,
    brandName: brandName || name,
    niche,
    instagramHandle: instagramHandle || "",
    competitors: [] as string[],
    socialNetworks: ["Instagram"],
    toneOfVoice: toneOfVoice || "",
    contentGoal: contentGoal || "",
    hasVisualIdentity: false,
    obsidianPath: "",
    createdAt: new Date().toISOString(),
    status: "onboarding" as const,
  };

  await upsertClient(client);

  const briefingContent = `# ${name}\n\n**Marca:** ${brandName || name}\n**Nicho:** ${niche}\n**Instagram:** @${instagramHandle || ""}\n**Tom de voz:** ${toneOfVoice || ""}\n**Objetivo:** ${contentGoal || ""}\n`;
  await writeNoteAsync(id, "briefing.md", briefingContent);

  return NextResponse.json({ ok: true, client });
}
