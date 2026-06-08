import { BriefingResponse, Client } from "./types";
import { buildICPPrompt } from "../prompts/icp";
import { callClaude } from "./claude";
import { writeNote } from "./obsidian";

function buildBusinessDescription(briefing: BriefingResponse): string {
  const lines = [
    `Nome da marca: ${briefing.brandName}`,
    `Produto/serviço: ${briefing.differentials}`,
    `Localização: ${briefing.city}`,
    `Tom de voz: ${briefing.toneOfVoice}`,
    `Objetivo de conteúdo: ${briefing.contentGoal}`,
  ];

  if (briefing.niche === "life-insurance") {
    lines.push(
      `Nicho: Agente de Life Insurance`,
      `Produtos: ${briefing.insuranceProducts?.join(", ") ?? ""}`,
    );
  } else if (briefing.niche === "real-estate") {
    lines.push(
      `Nicho: Corretor de Imóveis`,
      `Tipo de imóvel: ${briefing.propertyType?.join(", ") ?? ""}`,
      `Faixa de preço: ${briefing.priceRange ?? ""}`,
    );
  }

  return lines.join("\n");
}

export async function generateICP(
  client: Client,
  briefing: BriefingResponse
): Promise<string> {
  const business = buildBusinessDescription(briefing);
  const clientDescription = briefing.idealClient;

  const prompt = buildICPPrompt(business, clientDescription);
  console.log(`🎯 Gerando ICP para ${client.name}...`);

  const raw = await callClaude(prompt, 6000);

  // Extrair conteúdo entre <answer> tags se presentes
  const match = raw.match(/<answer>([\s\S]*?)<\/answer>/);
  const content = match ? match[1].trim() : raw;

  const note = `# ICP — ${client.brandName}\n\n*Gerado em: ${new Date().toLocaleDateString("pt-BR")}*\n\n---\n\n${content}`;
  writeNote(client.id, "ICP.md", note);

  console.log(`✅ ICP salvo em Obsidian: ${client.id}/ICP.md`);
  return content;
}
