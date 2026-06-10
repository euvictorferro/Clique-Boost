/**
 * weeklyAnalysis.ts
 *
 * Analisa a performance da semana passada para um cliente:
 * - Pega posts dos últimos 7 dias via Meta API
 * - Calcula top e bottom performers
 * - Compara com a semana anterior
 * - Gera relatório de insights com Claude
 * - Salva em Obsidian
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { Client, MetaPost } from "./types";
import { fetchClientInsights } from "./metaInsights";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const OBSIDIAN = process.env.OBSIDIAN_VAULT_PATH ?? "";

export interface WeeklyAnalysisResult {
  clientId: string;
  clientName: string;
  weekLabel: string;       // ex: "2026-W23"
  postsAnalyzed: number;
  avgEngagement: number;
  topPerformers: PostPerf[];
  bottomPerformers: PostPerf[];
  insights: string;        // markdown gerado pelo Claude
  recommendations: string[]; // lista de recomendações para a semana seguinte
  savedAt: string;
}

export interface PostPerf {
  permalink: string;
  mediaType: string;
  caption: string;
  engagement: number;
  likeCount: number;
  commentsCount: number;
  saves: number;
  reach: number;
  engagementRate: number;
}

function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function toPostPerf(p: MetaPost, followerCount: number): PostPerf {
  const engagement = p.likeCount + p.commentsCount + p.saves + p.shares;
  const engagementRate = followerCount > 0 ? (engagement / followerCount) * 100 : 0;
  return {
    permalink: p.permalink,
    mediaType: p.mediaType,
    caption: (p.caption ?? "").slice(0, 200),
    engagement,
    likeCount: p.likeCount,
    commentsCount: p.commentsCount,
    saves: p.saves,
    reach: p.reach,
    engagementRate: parseFloat(engagementRate.toFixed(2)),
  };
}

function formatInsightsMd(result: WeeklyAnalysisResult): string {
  const lines = [
    `# Análise Semanal — ${result.clientName}`,
    `**Semana:** ${result.weekLabel}  `,
    `**Posts analisados:** ${result.postsAnalyzed}  `,
    `**Engajamento médio:** ${result.avgEngagement.toLocaleString("pt-BR")}  `,
    `**Gerado em:** ${new Date(result.savedAt).toLocaleString("pt-BR")}`,
    ``,
    `---`,
    ``,
    `## 🏆 Top Performers`,
    ``,
    ...result.topPerformers.map((p, i) =>
      `${i + 1}. **${p.mediaType}** — ${p.engagement.toLocaleString("pt-BR")} eng. (${p.engagementRate}%) | ❤️${p.likeCount} 💬${p.commentsCount} 🔖${p.saves}\n   > ${p.caption.slice(0, 120)}\n   > [Ver post](${p.permalink})`
    ),
    ``,
    `## ⚠️ Precisam melhorar`,
    ``,
    ...result.bottomPerformers.map((p, i) =>
      `${i + 1}. **${p.mediaType}** — ${p.engagement.toLocaleString("pt-BR")} eng. (${p.engagementRate}%)\n   > ${p.caption.slice(0, 120)}\n   > [Ver post](${p.permalink})`
    ),
    ``,
    `---`,
    ``,
    `## 🧠 Análise Estratégica`,
    ``,
    result.insights,
    ``,
    `---`,
    ``,
    `## ✅ Recomendações para a Próxima Semana`,
    ``,
    ...result.recommendations.map((r, i) => `${i + 1}. ${r}`),
    ``,
  ];
  return lines.join("\n");
}

export async function runWeeklyAnalysis(client: Client): Promise<WeeklyAnalysisResult> {
  console.log(`📊 Analisando semana de ${client.name}...`);

  const insights = await fetchClientInsights(client, 14); // 14 dias para ter semana atual e anterior
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const allPosts = insights.topPosts ?? [];
  const lastWeekPosts = allPosts.filter((p) => {
    const d = new Date(p.timestamp);
    return d >= weekAgo && d <= now;
  });
  const prevWeekPosts = allPosts.filter((p) => {
    const d = new Date(p.timestamp);
    return d >= twoWeeksAgo && d < weekAgo;
  });

  const follower = insights.followerCount ?? 1000;
  const perfs = lastWeekPosts.map((p) => toPostPerf(p, follower));
  perfs.sort((a, b) => b.engagement - a.engagement);

  const topPerformers = perfs.slice(0, 3);
  const bottomPerformers = [...perfs].reverse().slice(0, 3);
  const avgEngagement = perfs.length > 0
    ? Math.round(perfs.reduce((s, p) => s + p.engagement, 0) / perfs.length)
    : 0;

  const prevAvg = prevWeekPosts.length > 0
    ? Math.round(prevWeekPosts.reduce((s, p) => s + p.likeCount + p.commentsCount, 0) / prevWeekPosts.length)
    : 0;

  const nicheLabel = client.niche === "life-insurance" ? "Life Insurance"
    : client.niche === "real-estate" ? "mercado imobiliário"
    : "marketing digital";

  const prompt = `Você é um estrategista de social media especializado em ${nicheLabel}.

Analise a performance da última semana do perfil @${client.instagramHandle ?? client.name} (${client.brandName}).

**Dados da semana:**
- Posts publicados: ${lastWeekPosts.length}
- Engajamento médio: ${avgEngagement} (semana anterior: ${prevAvg})
- Seguidores: ${follower.toLocaleString("pt-BR")}
- Alcance total da conta (30d): ${insights.reach?.toLocaleString("pt-BR") ?? "—"}

**Top posts da semana:**
${topPerformers.map((p, i) => `${i + 1}. ${p.mediaType} — ${p.engagement} eng. (${p.engagementRate}%)\n   Caption: "${p.caption.slice(0, 150)}"`).join("\n\n")}

**Posts que underperformaram:**
${bottomPerformers.map((p, i) => `${i + 1}. ${p.mediaType} — ${p.engagement} eng. (${p.engagementRate}%)\n   Caption: "${p.caption.slice(0, 150)}"`).join("\n\n")}

**Contexto do cliente:**
- Tom de voz: ${client.toneOfVoice || "Profissional"}
- Objetivo: ${client.contentGoal || "Gerar leads"}

Escreva uma análise estratégica concisa (máximo 250 palavras) explicando:
1. O que funcionou e por quê
2. O que não funcionou e por quê
3. Padrões identificados (formato, horário, tipo de conteúdo)

Depois, retorne um JSON separado (após a análise) com uma lista de 5 recomendações específicas para a semana seguinte:
["recomendação 1", "recomendação 2", ...]

Formato da resposta: primeiro o texto da análise, depois uma linha com "---JSON---", depois o JSON.`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (msg.content[0] as any).text as string;
  const parts = raw.split("---JSON---");
  const analysisText = parts[0].trim();
  let recommendations: string[] = [];
  try {
    const jsonMatch = parts[1]?.match(/\[[\s\S]*\]/);
    if (jsonMatch) recommendations = JSON.parse(jsonMatch[0]);
  } catch { /* usa lista vazia */ }

  const weekLabel = isoWeekLabel(now);
  const result: WeeklyAnalysisResult = {
    clientId: client.id,
    clientName: client.name,
    weekLabel,
    postsAnalyzed: lastWeekPosts.length,
    avgEngagement,
    topPerformers,
    bottomPerformers,
    insights: analysisText,
    recommendations,
    savedAt: new Date().toISOString(),
  };

  // Salva no Obsidian
  if (OBSIDIAN && client.obsidianPath) {
    try {
      const analysesDir = path.join(client.obsidianPath, "analises");
      if (!existsSync(analysesDir)) mkdirSync(analysesDir, { recursive: true });
      const filename = `${weekLabel}.md`;
      writeFileSync(path.join(analysesDir, filename), formatInsightsMd(result), "utf-8");
      console.log(`✅ Análise salva: ${client.id}/analises/${filename}`);
    } catch (err) {
      console.warn("⚠️ Erro ao salvar análise no Obsidian:", err);
    }
  }

  return result;
}
