/**
 * weeklyRefresh.ts
 *
 * Atualiza o calendário da próxima semana com base em:
 * - Análise da semana que passou (o que funcionou/não funcionou)
 * - Posts viralizando nos concorrentes agora
 * - Estratégia do cliente
 *
 * Resultado: posts da próxima semana no Trello substituídos/complementados
 * com conteúdo mais relevante.
 */

import { readdirSync } from "fs";
import path from "path";
import { Client, ContentPost } from "@clique-boost/shared";
import { getViralPosts } from "./apify";
import { getBoardCards, getOrCreateList, createCard, TrelloCard, TrelloList } from "./trello";
import Anthropic from "@anthropic-ai/sdk";
import { WeeklyAnalysisResult } from "./weeklyAnalysis";
import { readNote, getClientPath } from "./obsidian";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const OBSIDIAN = process.env.OBSIDIAN_VAULT_PATH ?? "";

/** Retorna o número da semana do mês para uma data */
function weekOfMonth(date: Date): number {
  const day = date.getDate();
  return Math.ceil(day / 7);
}

/** Lê análise salva da semana passada, se existir */
function readLastAnalysis(client: Client): WeeklyAnalysisResult | null {
  try {
    const analysesDir = path.join(getClientPath(client.id), "Análises");
    const files = readdirSync(analysesDir)
      .filter((f: string) => f.endsWith(".md"))
      .sort()
      .reverse();
    if (!files.length) return null;
    const fs = require("fs");
    const content = fs.readFileSync(path.join(analysesDir, files[0]), "utf-8");
    const recSection = content.split("## ✅ Recomendações para a Próxima Semana")[1];
    const recommendations = recSection
      ? recSection.trim().split("\n")
          .filter((l: string) => /^\d+\./.test(l.trim()))
          .map((l: string) => l.replace(/^\d+\.\s*/, "").trim())
      : [];
    return { recommendations } as WeeklyAnalysisResult;
  } catch {
    return null;
  }
}

/** Lê estratégia do Obsidian */
function readStrategy(client: Client): string {
  return (readNote(client.id, "estrategia-conteudo.md") ?? "").slice(0, 2000);
}

export interface RefreshResult {
  clientId: string;
  clientName: string;
  weekNum: number;
  postsReplaced: number;
  postsAdded: number;
  changes: string[];
}

export async function runWeeklyRefresh(client: Client): Promise<RefreshResult> {
  console.log(`🔄 Refresh semanal para ${client.name}...`);

  const now = new Date();
  // Próxima semana
  const nextWeekDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeek = weekOfMonth(nextWeekDate);
  const month = `${nextWeekDate.getFullYear()}-${String(nextWeekDate.getMonth() + 1).padStart(2, "0")}`;

  const result: RefreshResult = {
    clientId: client.id,
    clientName: client.name,
    weekNum: nextWeek,
    postsReplaced: 0,
    postsAdded: 0,
    changes: [],
  };

  // 1. Lê análise da semana passada
  const lastAnalysis = readLastAnalysis(client);
  const strategy = readStrategy(client);

  // 2. Scrapa posts virais dos concorrentes (últimos 7 dias)
  let trendingPosts: string[] = [];
  if (client.competitors?.length) {
    try {
      const viral = await getViralPosts(client.competitors, 7, 8);
      trendingPosts = viral.map((p) =>
        `@${p.ownerUsername}: "${p.caption?.slice(0, 150) ?? ""}" (${(p.likesCount + (p.videoPlayCount ?? 0)).toLocaleString()} eng.)`
      );
      console.log(`  ✅ ${trendingPosts.length} posts trending dos concorrentes`);
    } catch {
      console.warn("  ⚠️ Falha ao scrapar concorrentes para o refresh");
    }
  }

  // 3. Pega posts atuais da semana seguinte no Trello
  let currentNextWeekPosts: TrelloCard[] = [];
  let lists: TrelloList[] = [];
  if (client.trelloBoardId) {
    try {
      const board = await getBoardCards(client.trelloBoardId);
      lists = board.lists;
      const weekList = board.lists.find((l) => l.name === `Semana ${nextWeek}`);
      if (weekList) {
        currentNextWeekPosts = board.cards.filter((c) => c.idList === weekList.id);
      }
    } catch (err) {
      console.warn("  ⚠️ Erro ao ler Trello:", err);
    }
  }

  // 4. Claude decide o que atualizar
  const prompt = `Você é um estrategista de social media. Sua tarefa é atualizar o calendário de conteúdo da próxima semana (Semana ${nextWeek}) para ${client.name} (${client.brandName}).

**Posts atualmente planejados para a Semana ${nextWeek}:**
${currentNextWeekPosts.length > 0
  ? currentNextWeekPosts.map((c, i) => `${i + 1}. ${c.name}\n   ${c.desc?.slice(0, 200) ?? ""}`).join("\n\n")
  : "Nenhum post planejado ainda."}

${lastAnalysis?.recommendations?.length
  ? `**Recomendações da análise da semana passada:**\n${lastAnalysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
  : ""}

${trendingPosts.length
  ? `**O que está viralizando nos concorrentes agora:**\n${trendingPosts.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
  : ""}

${strategy ? `**Estratégia do cliente (resumo):**\n${strategy.slice(0, 800)}` : ""}

**Tom de voz:** ${client.toneOfVoice || "Profissional"}
**Objetivo:** ${client.contentGoal || "Gerar leads qualificados"}

Com base nas recomendações da análise e no que está viralizando, sugira 5 posts otimizados para a Semana ${nextWeek}.
Para cada post que substitui um existente, explique brevemente por quê.

Retorne APENAS um JSON array:
[
  {
    "week": ${nextWeek},
    "day": <dia do mês>,
    "date": "${month}-<DD>",
    "theme": "tema do post",
    "format": "Reel" | "Carrossel" | "Foto" | "Stories",
    "platforms": ["Instagram"],
    "hook": "gancho de abertura",
    "objective": "objetivo no funil",
    "rationale": "por que este post nesta semana (max 80 chars)",
    "replacedPost": "nome do post substituído ou null"
  }
]`;

  let newPosts: ContentPost[] = [];
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = (msg.content[0] as any).text as string;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) newPosts = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("  ❌ Erro ao gerar posts com Claude:", err);
    return result;
  }

  // 5. Atualiza no Trello: cria lista da semana e adiciona cards novos
  if (client.trelloBoardId && newPosts.length > 0) {
    try {
      const listId = await getOrCreateList(client.trelloBoardId, `Semana ${nextWeek}`);

      for (const post of newPosts) {
        await createCard(listId, post);
        if ((post as any).replacedPost) {
          result.postsReplaced++;
          result.changes.push(`Substituiu "${(post as any).replacedPost}" → "${post.theme}"`);
        } else {
          result.postsAdded++;
          result.changes.push(`Adicionou: "${post.theme}" (${post.format})`);
        }
      }
      console.log(`  ✅ ${newPosts.length} posts atualizados no Trello`);
    } catch (err) {
      console.error("  ❌ Erro ao atualizar Trello:", err);
    }
  }

  return result;
}
