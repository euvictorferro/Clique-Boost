import { NextRequest, NextResponse } from "next/server";
import { readClients, writeClients } from "@/lib/clients";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const OBSIDIAN_VAULT =
  process.env.OBSIDIAN_VAULT_PATH ??
  "/Users/victorferro/Library/Mobile Documents/iCloud~md~obsidian/Documents/[Clique Boost] - Second Brain";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, brandName, niche, instagramHandle, toneOfVoice, contentGoal } = body;

  if (!name || !niche) {
    return NextResponse.json({ error: "name e niche são obrigatórios" }, { status: 400 });
  }

  const id = slugify(name);
  const existing = readClients();

  if (existing.find((c) => c.id === id)) {
    return NextResponse.json({ error: `Cliente "${id}" já existe` }, { status: 409 });
  }

  const obsidianPath = path.join(OBSIDIAN_VAULT, "01 - Clientes", id);

  try {
    mkdirSync(obsidianPath, { recursive: true });
    writeFileSync(
      path.join(obsidianPath, "briefing.md"),
      `# ${name}\n\n**Marca:** ${brandName || name}\n**Nicho:** ${niche}\n**Instagram:** @${instagramHandle || ""}\n**Tom de voz:** ${toneOfVoice || ""}\n**Objetivo:** ${contentGoal || ""}\n`,
      "utf-8"
    );
  } catch (err) {
    return NextResponse.json({ error: `Erro ao criar pasta Obsidian: ${err}` }, { status: 500 });
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
    obsidianPath,
    createdAt: new Date().toISOString(),
    status: "onboarding" as const,
  };

  writeClients([...existing, client]);

  return NextResponse.json({ ok: true, client });
}
