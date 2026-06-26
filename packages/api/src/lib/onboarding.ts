import { v4 as uuidv4 } from "uuid";
import { BriefingResponse, Client } from "@clique-boost/shared";
import { slugify, upsertClient } from "./clients";
import { writeNote, ensureClientFolder, getClientPath } from "./obsidian";
import { createBoard, syncCalendarToTrello } from "./trello";

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

function formatVozTemplate(briefing: BriefingResponse): string {
  return `---
tags: [voz, personalidade, ${slugify(briefing.clientName)}]
cliente: ${slugify(briefing.clientName)}
---

# Voz & Personalidade — ${briefing.brandName}

> Arquivo lido automaticamente pelo sistema para personalizar geração de conteúdo.
> Preencha e atualize conforme você conhecer melhor o cliente.

---

## Tom e Personalidade

${briefing.toneOfVoice}

*(Expanda aqui com mais detalhes sobre energia, ritmo, proximidade)*

---

## Frases e expressões que ele/ela usaria

*(Preencha com falas reais que o cliente usa ou aprovaria)*

---

## Frases que ele/ela NUNCA usaria

*(Preencha com o que está fora do tom ou posicionamento)*

---

## Público com quem ele/ela fala

${briefing.idealClient}

---

## Objetivo principal do conteúdo

${briefing.contentGoal}

---

## Ganchos que funcionam no nicho

*(Preencha conforme você conhecer os posts que performam)*

---

## Posts que já funcionaram bem

*(Cole aqui legendas de posts com bom engajamento)*
`.trim();
}

export async function onboardClient(briefing: BriefingResponse): Promise<Client> {
  const id = slugify(briefing.clientName) || uuidv4();
  const obsidianPath = getClientPath(id);

  ensureClientFolder(id);
  writeNote(id, "briefing.md", formatBriefingNote(briefing));
  writeNote(id, "voz.md", formatVozTemplate(briefing));

  // Cria board no Trello automaticamente
  let trelloBoardId: string | undefined;
  if (process.env.TRELLO_API_KEY && process.env.TRELLO_TOKEN) {
    try {
      trelloBoardId = await createBoard(briefing.brandName);
      console.log(`✅ Board Trello criado: ${briefing.brandName} (${trelloBoardId})`);
    } catch (err) {
      console.warn("⚠️ Falha ao criar board Trello:", err);
    }
  }

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
    trelloBoardId,
    createdAt: new Date().toISOString(),
    status: "onboarding",
  };

  await upsertClient(client);
  console.log(`✅ Cliente onboardado: ${client.name} (${client.id})`);
  return client;
}
