import { v4 as uuidv4 } from "uuid";
import { BriefingResponse, Client } from "./types";
import { slugify, upsertClient } from "./clients";
import { writeNote, ensureClientFolder, getClientPath } from "./obsidian";

function formatBriefingNote(briefing: BriefingResponse): string {
  const lines: string[] = [
    `# Briefing — ${briefing.brandName}`,
    ``,
    `**Preenchido em:** ${new Date().toLocaleDateString("pt-BR")}`,
    `**Nicho:** ${briefing.niche}`,
    ``,
    `## Informações Básicas`,
    `- **Nome:** ${briefing.clientName}`,
    `- **Marca:** ${briefing.brandName}`,
    `- **Cidade/Estado:** ${briefing.city}`,
    briefing.instagramHandle ? `- **Instagram:** @${briefing.instagramHandle}` : "",
    ``,
    `## Cliente Ideal`,
    briefing.idealClient,
    ``,
    `## Diferenciais`,
    briefing.differentials,
    ``,
    `## Tom de Voz`,
    briefing.toneOfVoice,
    ``,
    `## Objetivo do Conteúdo`,
    briefing.contentGoal,
    ``,
    `## Redes Sociais`,
    briefing.socialNetworks.map((s) => `- ${s}`).join("\n"),
    ``,
    `## Concorrentes / Referências`,
    briefing.competitors.map((c) => `- @${c.replace("@", "")}`).join("\n"),
    ``,
    `## Identidade Visual`,
    `- **Tem identidade visual:** ${briefing.hasVisualIdentity ? "Sim" : "Não"}`,
  ];

  if (briefing.brandColors) {
    lines.push(`- **Cores:** ${briefing.brandColors}`);
  }

  if (briefing.niche === "life-insurance") {
    lines.push(
      ``,
      `## Life Insurance — Detalhes`,
      `- **Produtos:** ${briefing.insuranceProducts?.join(", ") ?? ""}`,
      `- **Público:** ${briefing.targetAudience ?? ""}`,
      `- **Objeção principal:** ${briefing.clientObjection ?? ""}`,
      `- **Cases de sucesso:** ${briefing.successCases ?? ""}`,
    );
  }

  if (briefing.niche === "real-estate") {
    lines.push(
      ``,
      `## Corretor — Detalhes`,
      `- **Tipo de imóvel:** ${briefing.propertyType?.join(", ") ?? ""}`,
      `- **Faixa de preço:** ${briefing.priceRange ?? ""}`,
      `- **Modelo de trabalho:** ${briefing.workModel ?? ""}`,
      `- **Construtoras:** ${briefing.builderPartners ?? ""}`,
      `- **Medo do comprador:** ${briefing.buyerFear ?? ""}`,
      `- **Material disponível:** ${briefing.hasMediaAssets ?? ""}`,
    );
  }

  return lines.join("\n");
}

export async function onboardClient(briefing: BriefingResponse): Promise<Client> {
  const id = slugify(briefing.clientName) || uuidv4();
  const obsidianPath = getClientPath(id);

  ensureClientFolder(id);
  writeNote(id, "briefing.md", formatBriefingNote(briefing));

  const client: Client = {
    id,
    name: briefing.clientName,
    brandName: briefing.brandName,
    niche: briefing.niche,
    instagramHandle: briefing.instagramHandle,
    competitors: briefing.competitors.map((c) => c.replace("@", "").trim()),
    socialNetworks: briefing.socialNetworks,
    toneOfVoice: briefing.toneOfVoice,
    contentGoal: briefing.contentGoal,
    hasVisualIdentity: briefing.hasVisualIdentity,
    brandColors: briefing.brandColors,
    obsidianPath,
    createdAt: new Date().toISOString(),
    status: "onboarding",
  };

  upsertClient(client);
  console.log(`✅ Cliente onboardado: ${client.name} (${client.id})`);
  return client;
}
