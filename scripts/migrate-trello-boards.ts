/**
 * Migração one-shot: importa cards do Trello para o board nativo (Supabase).
 * Execute: npx tsx scripts/migrate-trello-boards.ts [clientId]
 *
 * Se clientId não for passado, migra todos os clientes com trelloBoardId.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env") });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRELLO_KEY = process.env.TRELLO_API_KEY!;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN!;
const DATA = path.join(__dirname, "../data");

const DEFAULT_COLUMNS = ["Backlog", "Semana 1", "Semana 2", "Semana 3", "Semana 4", "Postados"];

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  idList: string;
}

interface TrelloList {
  id: string;
  name: string;
}

async function trelloFetch(path: string) {
  const url = `https://api.trello.com/1${path}${path.includes("?") ? "&" : "?"}key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Trello API error: ${res.status} ${path}`);
  return res.json();
}

async function getOrCreateBoard(clientId: string, clientName: string): Promise<{ boardId: string; colByName: Map<string, string> }> {
  const { data: existing } = await supabase.from("boards").select("id").eq("client_id", clientId).single();

  let boardId: string;
  if (existing) {
    boardId = existing.id;
    console.log(`  Board existente: ${boardId}`);
  } else {
    const { data: board } = await supabase
      .from("boards")
      .insert({ client_id: clientId, name: `${clientName} — Conteúdo` })
      .select()
      .single();
    boardId = board!.id;

    const cols = DEFAULT_COLUMNS.map((name, i) => ({ board_id: boardId, name, position: i }));
    await supabase.from("board_columns").insert(cols);
    await supabase.from("clients").update({ board_id: boardId }).eq("id", clientId);
    console.log(`  Board criado: ${boardId}`);
  }

  const { data: cols } = await supabase.from("board_columns").select("id,name").eq("board_id", boardId);
  const colByName = new Map<string, string>();
  for (const c of cols ?? []) colByName.set(c.name, c.id);

  return { boardId, colByName };
}

function parseDay(cardName: string, due: string | null): { day: number | null; date: string | null } {
  const dayMatch = cardName.match(/Dia\s+(\d+)/i);
  const day = dayMatch ? parseInt(dayMatch[1]) : null;
  const date = due ? due.slice(0, 10) : null;
  return { day, date };
}

function parseFormat(cardName: string): string | null {
  const m = cardName.match(/\[(Reel|Carrossel|Stories|TikTok)\]/i);
  return m ? m[1] : null;
}

function parseTheme(cardName: string): string {
  return cardName.replace(/\[.*?\]/g, "").replace(/Dia\s+\d+/i, "").replace(/[^\w\sÀ-ú—–-]/g, "").trim().replace(/^[—–-]+/, "").trim();
}

function parseHook(desc: string): string | null {
  const m = desc.match(/(?:Gancho|Hook)[:\s]+([^\n]+)/i);
  return m?.[1]?.trim() ?? null;
}

function parseObjective(desc: string): string | null {
  const m = desc.match(/(?:Objetivo)[:\s]+([^\n]+)/i);
  return m?.[1]?.trim() ?? null;
}

async function migrateClient(clientId: string, clientName: string, trelloBoardId: string) {
  console.log(`\n→ Migrando ${clientName} (${clientId}) — Trello board ${trelloBoardId}`);

  let lists: TrelloList[], cards: TrelloCard[];
  try {
    lists = await trelloFetch(`/boards/${trelloBoardId}/lists`);
    cards = await trelloFetch(`/boards/${trelloBoardId}/cards`);
  } catch (err) {
    console.error(`  ✗ Erro ao buscar Trello:`, err);
    return;
  }

  const listNameById = new Map<string, string>();
  for (const l of lists) listNameById.set(l.id, l.name);

  const { boardId, colByName } = await getOrCreateBoard(clientId, clientName);

  let imported = 0;
  for (const card of cards) {
    const listName = listNameById.get(card.idList) ?? "Backlog";
    const columnId = colByName.get(listName) ?? colByName.get("Backlog")!;
    const { day, date } = parseDay(card.name, card.due);
    const format = parseFormat(card.name);
    const theme = parseTheme(card.name);
    const hook = parseHook(card.desc);
    const objective = parseObjective(card.desc);

    const weekMatch = listName.match(/Semana\s+(\d)/i);
    const week = weekMatch ? parseInt(weekMatch[1]) : null;

    await supabase.from("cards").insert({
      column_id: columnId,
      board_id: boardId,
      position: imported,
      title: card.name,
      week,
      day,
      date,
      theme: theme || card.name,
      format,
      platforms: [],
      hook,
      objective,
      notes: card.desc || null,
      status: listName.toLowerCase().includes("postado") ? "published" : "draft",
    });
    imported++;
  }

  console.log(`  ✓ ${imported} cards importados`);
}

async function main() {
  const targetClientId = process.argv[2];
  const clientsFile = path.join(DATA, "clients.json");

  if (!fs.existsSync(clientsFile)) {
    console.error("data/clients.json não encontrado");
    process.exit(1);
  }

  const allClients: Array<{ id: string; name: string; trelloBoardId?: string }> = JSON.parse(
    fs.readFileSync(clientsFile, "utf-8")
  );

  const targets = allClients.filter(
    (c) => c.trelloBoardId && (!targetClientId || c.id === targetClientId)
  );

  if (targets.length === 0) {
    console.log("Nenhum cliente com trelloBoardId encontrado.");
    return;
  }

  console.log(`Migrando ${targets.length} cliente(s)…`);
  for (const c of targets) {
    await migrateClient(c.id, c.name, c.trelloBoardId!);
  }
  console.log("\nMigração concluída.");
}

main().catch(console.error);
