/**
 * postGenerator.ts
 *
 * Gera sugestões de posts para a semana usando Claude,
 * com contexto do ICP, estratégia e posts virais de concorrentes.
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getAllCopySkills } from "../../prompts/copySkills";
import { readNote } from "./obsidian";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GeneratedPost {
  id: string;
  day: number;         // dia do mês (ex: 16)
  week: number;        // semana (1-4)
  weekday: string;     // "Segunda", "Terça", etc.
  theme: string;       // tema principal
  format: string;      // Reel | Carrossel | Foto | Stories
  platform: string;    // Instagram | TikTok
  hook: string;        // primeira frase / gancho
  caption: string;     // legenda completa sugerida
  hashtags: string[];  // hashtags sugeridas
  objective: string;   // objetivo do post no funil
  cta: string;         // call to action
  pillar: string;      // pilar de conteúdo
  status: "rascunho";  // sempre começa como rascunho
}

/** Lê um arquivo do Obsidian pelo clientId */
function readObsidian(clientId: string, filename: string): string {
  return (readNote(clientId, filename) ?? "").slice(0, 3000);
}

/** Lê posts de concorrentes já analisados */
function readCompetitorInsights(dataDir: string, clientId: string): string {
  try {
    const p = path.join(dataDir, "competitors", `${clientId}.json`);
    if (!existsSync(p)) return "";
    const cache = JSON.parse(readFileSync(p, "utf-8"));
    const analyzed = (cache.posts ?? [])
      .filter((p: any) => p.analysis)
      .slice(0, 3);
    if (!analyzed.length) return "";
    return analyzed
      .map(
        (p: any) =>
          `Post @${p.username} (${p.format}, ${(p.likesCount + p.commentsCount).toLocaleString()} eng.):\n` +
          `Caption: "${p.caption?.slice(0, 150)}"\n` +
          `Análise: ${p.analysis?.slice(0, 300)}`
      )
      .join("\n\n");
  } catch {}
  return "";
}

/** Calcula o dia do mês para cada dia da semana N */
function weekDays(year: number, month: number, week: number): { weekday: string; day: number }[] {
  // Semanas fixas: S1=1-7, S2=8-14, S3=15-21, S4=22-28
  const startDay = (week - 1) * 7 + 1;
  const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
  const daysInMonth = new Date(year, month, 0).getDate();
  return weekdays.map((weekday, i) => ({
    weekday,
    day: Math.min(startDay + i, daysInMonth),
  }));
}

export async function generateWeekPosts(
  client: any,
  week: number,
  month: string, // "2026-06"
  dataDir: string
): Promise<GeneratedPost[]> {
  const [year, monthNum] = month.split("-").map(Number);
  const days = weekDays(year, monthNum, week);

  const icp = readObsidian(client.id, "ICP.md");
  const strategy = readObsidian(client.id, "estrategia-conteudo.md");
  const funnel = readObsidian(client.id, "funil-organico.md");
  const voz = readObsidian(client.id, "voz.md");
  const competitors = readCompetitorInsights(dataDir, client.id);

  const nicheLabel =
    client.niche === "life-insurance"
      ? "Life Insurance"
      : client.niche === "real-estate"
      ? "mercado imobiliário"
      : "marketing digital e social media";

  const prompt = `Você é um estrategista de conteúdo sênior especializado em ${nicheLabel} para criadores brasileiros nos EUA. Você escreve copy que soa humana, específica e persuasiva, nunca genérica.

Crie 5 posts para a Semana ${week} de ${new Date(year, monthNum - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" })} para o cliente **${client.name}** (${client.brandName ?? client.name}).

**IDENTIDADE DO CLIENTE:**
- Tom de voz: ${client.toneOfVoice || "Profissional e próximo"}
- Objetivo: ${client.contentGoal || "Gerar leads qualificados"}
- Nicho: ${nicheLabel}

**Dias disponíveis:**
${days.map((d) => `- ${d.weekday}, dia ${d.day}`).join("\n")}

${icp ? `**ICP (cliente ideal):**\n${icp}` : ""}

${strategy ? `**Estratégia de conteúdo:**\n${strategy}` : ""}

${funnel ? `**Funil orgânico:**\n${funnel}` : ""}

${voz ? `**VOZ E PERSONALIDADE DO CLIENTE (siga rigorosamente — isso define o tom de TUDO):**\n${voz}` : ""}

${competitors ? `**O que está viralizando nos concorrentes (inspire-se, não copie):**\n${competitors}` : ""}

${getAllCopySkills()}

ATENÇÃO ESPECIAL para a "caption": ela deve seguir a skill do formato do post. Para Carrossel, descreva slide a slide. Para Reel, escreva como legenda de vídeo. Para Foto, conte uma história. Nunca bullet points genéricos.

Retorne EXATAMENTE um JSON array com 5 objetos. Cada objeto deve ter:
{
  "weekday": "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta",
  "theme": "tema do post (max 60 chars)",
  "format": "Reel" | "Carrossel" | "Foto" | "Stories",
  "platform": "Instagram",
  "hook": "primeira frase que prende atenção seguindo a skill do formato (max 100 chars)",
  "caption": "legenda completa seguindo a skill de copy do formato (200-400 chars)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "objective": "objetivo no funil (TOFU/MOFU/BOFU)",
  "cta": "call to action específico (max 60 chars)",
  "pillar": "pilar de conteúdo"
}

Retorne APENAS o JSON array, sem markdown, sem explicações.`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (msg.content[0] as any).text as string;

  // Extrai JSON do response
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Claude não retornou JSON válido");

  const parsed: any[] = JSON.parse(jsonMatch[0]);

  return parsed.map((p, i) => {
    const found = days.find((d) => d.weekday === p.weekday) ?? days[i] ?? days[0];
    return {
      id: `gen-${client.id}-${month}-w${week}-${i}`,
      day: found.day,
      week,
      weekday: found.weekday,
      theme: p.theme ?? "Post sem título",
      format: p.format ?? "Reel",
      platform: p.platform ?? "Instagram",
      hook: p.hook ?? "",
      caption: p.caption ?? "",
      hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
      objective: p.objective ?? "",
      cta: p.cta ?? "",
      pillar: p.pillar ?? "",
      status: "rascunho" as const,
    };
  });
}
