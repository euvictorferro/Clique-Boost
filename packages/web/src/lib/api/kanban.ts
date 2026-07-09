import { getSupabase } from "./supabase";
import { Board, BoardColumn, KanbanCard, ContentCalendar, Client } from "@clique-boost/shared";

const DEFAULT_COLUMNS = ["Backlog", "Semana 1", "Semana 2", "Semana 3", "Semana 4", "Postados"];

function mapCard(row: Record<string, unknown>): KanbanCard {
  return {
    id: row.id as string,
    columnId: row.column_id as string,
    boardId: row.board_id as string,
    position: row.position as number,
    title: row.title as string,
    week: row.week as number | undefined,
    day: row.day as number | undefined,
    date: row.date as string | undefined,
    theme: row.theme as string | undefined,
    format: row.format as KanbanCard["format"],
    platforms: (row.platforms as string[]) ?? [],
    hook: row.hook as string | undefined,
    caption: row.caption as string | undefined,
    hashtags: row.hashtags as string | undefined,
    objective: row.objective as string | undefined,
    rationale: row.rationale as string | undefined,
    storiesIdea: row.stories_idea as string | undefined,
    notes: row.notes as string | undefined,
    status: (row.status as KanbanCard["status"]) ?? "draft",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Busca ou cria o board de um cliente (com colunas padrão)
export async function getOrCreateBoard(clientId: string, clientName: string): Promise<Board> {
  const db = getSupabase();

  // Tenta buscar board existente
  const { data: existing } = await db
    .from("boards")
    .select("*")
    .eq("client_id", clientId)
    .single();

  let boardId: string;

  if (existing) {
    boardId = existing.id;
  } else {
    // Cria board
    const { data: board, error } = await db
      .from("boards")
      .insert({ client_id: clientId, name: `${clientName} — Conteúdo` })
      .select()
      .single();
    if (error) throw new Error(`Erro ao criar board: ${error.message}`);
    boardId = board.id;

    // Cria colunas padrão
    const cols = DEFAULT_COLUMNS.map((name, i) => ({
      board_id: boardId,
      name,
      position: i,
    }));
    const { error: colErr } = await db.from("board_columns").insert(cols);
    if (colErr) throw new Error(`Erro ao criar colunas: ${colErr.message}`);

    // Atualiza clients.board_id
    await db.from("clients").update({ board_id: boardId }).eq("id", clientId);
  }

  return getBoardWithColumns(boardId);
}

export async function getBoardWithColumns(boardId: string): Promise<Board> {
  const db = getSupabase();

  const { data: board, error: bErr } = await db
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();
  if (bErr) throw new Error(`Board não encontrado: ${bErr.message}`);

  const { data: columns, error: cErr } = await db
    .from("board_columns")
    .select("*")
    .eq("board_id", boardId)
    .order("position");
  if (cErr) throw new Error(`Erro ao buscar colunas: ${cErr.message}`);

  const { data: cards, error: cardErr } = await db
    .from("cards")
    .select("*")
    .eq("board_id", boardId)
    .order("position");
  if (cardErr) throw new Error(`Erro ao buscar cards: ${cardErr.message}`);

  const columnMap = new Map<string, BoardColumn>();
  for (const col of columns ?? []) {
    columnMap.set(col.id, {
      id: col.id,
      boardId: col.board_id,
      name: col.name,
      position: col.position,
      cards: [],
    });
  }
  for (const card of cards ?? []) {
    columnMap.get(card.column_id)?.cards.push(mapCard(card));
  }

  return {
    id: board.id,
    clientId: board.client_id,
    name: board.name,
    columns: Array.from(columnMap.values()),
    createdAt: board.created_at,
  };
}

// Substitui syncCalendarToTrello — escreve posts direto no banco
export async function syncCalendarToBoard(client: Client, calendar: ContentCalendar): Promise<number> {
  const db = getSupabase();
  const board = await getOrCreateBoard(client.id, client.name);

  // Mapeia colunas por nome
  const colByName = new Map<string, string>();
  for (const col of board.columns) {
    colByName.set(col.name, col.id);
  }

  // Remove cards das colunas Semana 1-4 existentes para o mês (re-sincronização limpa)
  const weekColIds = [1, 2, 3, 4]
    .map((w) => colByName.get(`Semana ${w}`))
    .filter(Boolean) as string[];

  if (weekColIds.length > 0) {
    await db.from("cards").delete().in("column_id", weekColIds);
  }

  let count = 0;
  for (const post of calendar.posts) {
    const colName = `Semana ${post.week}`;
    const columnId = colByName.get(colName) ?? colByName.get("Backlog");
    if (!columnId) continue;

    const title = `[${post.format}] Dia ${post.day} — ${post.theme}`;
    await db.from("cards").insert({
      column_id: columnId,
      board_id: board.id,
      position: count,
      title,
      week: post.week,
      day: post.day,
      date: post.date,
      theme: post.theme,
      format: post.format,
      platforms: post.platforms,
      hook: post.hook,
      objective: post.objective,
      rationale: post.rationale ?? null,
      stories_idea: post.storiesIdea ?? null,
      notes: post.notes ?? null,
      status: "draft",
    });
    count++;
  }

  return count;
}

export async function moveCard(cardId: string, newColumnId: string, newPosition: number): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from("cards")
    .update({ column_id: newColumnId, position: newPosition, updated_at: new Date().toISOString() })
    .eq("id", cardId);
  if (error) throw new Error(`Erro ao mover card: ${error.message}`);
}

export async function updateCard(cardId: string, fields: Partial<KanbanCard>): Promise<KanbanCard> {
  const db = getSupabase();
  const snake: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.title !== undefined) snake.title = fields.title;
  if (fields.status !== undefined) snake.status = fields.status;
  if (fields.hook !== undefined) snake.hook = fields.hook;
  if (fields.caption !== undefined) snake.caption = fields.caption;
  if (fields.hashtags !== undefined) snake.hashtags = fields.hashtags;
  if (fields.notes !== undefined) snake.notes = fields.notes;
  if (fields.platforms !== undefined) snake.platforms = fields.platforms;
  if (fields.position !== undefined) snake.position = fields.position;
  if (fields.columnId !== undefined) snake.column_id = fields.columnId;

  const { data, error } = await db.from("cards").update(snake).eq("id", cardId).select().single();
  if (error) throw new Error(`Erro ao atualizar card: ${error.message}`);
  return mapCard(data);
}

export async function createCard(columnId: string, boardId: string, fields: Partial<KanbanCard> & { title: string }): Promise<KanbanCard> {
  const db = getSupabase();
  const { data: maxPos } = await db
    .from("cards")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = maxPos ? (maxPos.position as number) + 1 : 0;

  const { data, error } = await db
    .from("cards")
    .insert({
      column_id: columnId,
      board_id: boardId,
      position,
      title: fields.title,
      week: fields.week ?? null,
      day: fields.day ?? null,
      date: fields.date ?? null,
      theme: fields.theme ?? null,
      format: fields.format ?? null,
      platforms: fields.platforms ?? [],
      hook: fields.hook ?? null,
      caption: fields.caption ?? null,
      hashtags: fields.hashtags ?? null,
      objective: fields.objective ?? null,
      notes: fields.notes ?? null,
      status: fields.status ?? "draft",
    })
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar card: ${error.message}`);
  return mapCard(data);
}

export async function deleteCard(cardId: string): Promise<void> {
  const db = getSupabase();
  const { error } = await db.from("cards").delete().eq("id", cardId);
  if (error) throw new Error(`Erro ao deletar card: ${error.message}`);
}
