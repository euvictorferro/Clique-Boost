import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { readClients } from "@/lib/clients";
import { getBoardCards, TrelloCard, TrelloList } from "@/lib/trello";

const OBSIDIAN_VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH ?? "";
const CALENDARS_PATH = `${OBSIDIAN_VAULT_PATH}/03 - Calendários`;

// Mapeamento de dia da semana (em PT e EN) para offset dentro da semana (0=Seg, 1=Ter...)
const DAY_OF_WEEK_OFFSET: Record<string, number> = {
  segunda: 0, monday: 0, seg: 0, mon: 0,
  terça: 1, terca: 1, tuesday: 1, ter: 1, tue: 1,
  quarta: 2, wednesday: 2, qua: 2, wed: 2,
  quinta: 3, thursday: 3, qui: 3, thu: 3,
  sexta: 4, friday: 4, sex: 4, fri: 4,
  sábado: 5, sabado: 5, saturday: 5, sab: 5, sat: 5,
  domingo: 6, sunday: 6, dom: 6, sun: 6,
};

/**
 * Para "Semana N" do Trello, retorna o dia 1 daquela semana no mês.
 * Usa semanas fixas: S1=1-7, S2=8-14, S3=15-21, S4=22-28
 */
function weekStartDay(_year: number, _month: number, weekNum: number): number {
  return (weekNum - 1) * 7 + 1;
}

/**
 * Extrai o número da semana do nome da lista (ex: "Semana 2" → 2).
 * "Backlog" e "Postados" retornam null.
 */
function weekNumFromList(listName: string): number | null {
  const m = listName.match(/(\d)/);
  if (!m) return null;
  return parseInt(m[1]);
}

/**
 * Extrai o offset do dia da semana a partir do nome do card.
 * Ex: "[IG · Reel] Quarta — tema" → 2 (quarta = offset 2 desde segunda)
 */
function dayOffsetFromCardName(name: string): number | null {
  const normalized = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [word, offset] of Object.entries(DAY_OF_WEEK_OFFSET)) {
    const norm = word.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (normalized.includes(norm)) return offset;
  }
  return null;
}

/** Converte cards do Trello em formato JSON de posts para CalendarView */
function trelloToCalendarPosts(
  cards: TrelloCard[],
  lists: TrelloList[],
  month: string
): CalendarPost[] {
  const listMap = new Map(lists.map((l) => [l.id, l.name]));
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const posts: CalendarPost[] = [];
  // Contador para fallback de dia sequencial por semana
  const weekDayCounter: Record<number, number> = {};

  for (const card of cards) {
    // Pula cards de listas não-conteúdo
    const listName = listMap.get(card.idList) ?? "";
    if (listName === "Postados") continue;

    let day: number;

    if (card.due) {
      // Card com data definida → usa diretamente
      const d = new Date(card.due);
      if (d.getFullYear() !== year || d.getMonth() + 1 !== monthNum) continue;
      day = d.getDate();
    } else {
      // Sem data: infere pelo nome da lista + dia da semana no título
      const weekNum = weekNumFromList(listName) ?? 1;
      const wStart = weekStartDay(year, monthNum, weekNum);
      const dowOffset = dayOffsetFromCardName(card.name);

      if (dowOffset !== null) {
        day = wStart + dowOffset;
      } else {
        // Fallback sequencial dentro da semana
        weekDayCounter[weekNum] = (weekDayCounter[weekNum] ?? 0) + 1;
        day = wStart + Math.min(weekDayCounter[weekNum] - 1, 6);
      }

      // Garante que o dia está dentro do mês
      day = Math.max(1, Math.min(day, daysInMonth));
    }

    // Extrai formato: "[IG · Reel]" → "Reel"; "[Reel]" → "Reel"
    const fmtMatch = card.name.match(/^\[([^\]]+)\]/);
    const rawFormat = fmtMatch ? fmtMatch[1] : "Reel";
    // Normaliza: "IG · Reel" → "Reel", "LI · Post" → "Post"
    const format = rawFormat.includes("·")
      ? rawFormat.split("·").pop()!.trim()
      : rawFormat.trim();

    // Plataforma: "IG" ou "LI" do prefixo
    const platform = rawFormat.toLowerCase().startsWith("li") ? "LinkedIn" : "Instagram";

    // Tema: texto após "—"
    const themeMatch = card.name.match(/[—–-]\s*(.+)$/);
    const theme = themeMatch ? themeMatch[1].trim() : card.name.replace(/^\[[^\]]+\]\s*/, "");

    // Extrai gancho e objetivo da descrição
    let hook = "";
    let objective = "";
    let notes = "";
    if (card.desc) {
      for (const line of card.desc.split("\n")) {
        if (line.includes("**Gancho:**")) hook = line.replace(/.*\*\*Gancho:\*\*\s*/, "").trim();
        else if (line.includes("**Objetivo:**")) objective = line.replace(/.*\*\*Objetivo:\*\*\s*/, "").trim();
        else if (line.includes("**Por que este conteúdo:**")) notes = line.replace(/.*\*\*Por que este conteúdo:\*\*\s*/, "").trim();
      }
    }

    posts.push({
      id: card.id,
      day,
      week: weekNumFromList(listName) ?? 1,
      theme,
      format,
      platform,
      hook,
      objective,
      notes,
      trelloUrl: card.url,
      listName,
    });
  }

  // Ordena por dia
  posts.sort((a, b) => a.day - b.day || a.platform.localeCompare(b.platform));
  return posts;
}

interface CalendarPost {
  id: string;
  day: number;
  week: number;
  theme: string;
  format: string;
  platform: string;
  hook?: string;
  objective?: string;
  notes?: string;
  trelloUrl?: string;
  listName?: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const { searchParams } = new URL(req.url);
  const rawMonth = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(rawMonth) ? rawMonth : new Date().toISOString().slice(0, 7);

  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  // 1. Tenta Trello se o cliente tiver boardId
  if (client.trelloBoardId) {
    try {
      const { cards, lists } = await getBoardCards(client.trelloBoardId);
      const posts = trelloToCalendarPosts(cards, lists, month);
      return NextResponse.json({ posts, month, source: "trello" }, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (err) {
      console.warn(`⚠️  Trello falhou para ${clientId}:`, (err as Error).message);
    }
  }

  // 2. Fallback: Obsidian markdown (retorna como markdown para compatibilidade)
  try {
    const filename = `${clientId}-${month}.md`;
    const content = readFileSync(path.join(CALENDARS_PATH, filename), "utf-8");
    return NextResponse.json({ content, month, source: "obsidian" });
  } catch {
    return NextResponse.json({ posts: [], month, source: "none" });
  }
}
