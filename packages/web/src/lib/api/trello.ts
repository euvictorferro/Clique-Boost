import { Client, ContentCalendar, ContentPost } from "@clique-boost/shared";
import { upsertClient } from "./clients";

const BOARD_LISTS = ["Backlog", "Semana 1", "Semana 2", "Semana 3", "Semana 4", "Postados"];

function getCredentials() {
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;
  if (!key || !token) throw new Error("TRELLO_API_KEY e TRELLO_TOKEN são obrigatórios");
  return { key, token };
}

async function trelloFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const { key, token } = getCredentials();
  const separator = path.includes("?") ? "&" : "?";
  const url = `https://api.trello.com/1${path}${separator}key=${key}&token=${token}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trello error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function createBoard(name: string): Promise<string> {
  const board = await trelloFetch("/boards", {
    method: "POST",
    body: JSON.stringify({ name, defaultLists: false, prefs_permissionLevel: "public" }),
  }) as { id: string };

  // Criar as 6 listas na ordem correta
  for (const listName of BOARD_LISTS) {
    await trelloFetch("/lists", {
      method: "POST",
      body: JSON.stringify({ name: listName, idBoard: board.id }),
    });
  }

  return board.id;
}

export async function getOrCreateList(boardId: string, name: string): Promise<string> {
  const lists = await trelloFetch(`/boards/${boardId}/lists`) as Array<{ id: string; name: string }>;
  const existing = lists.find((l) => l.name === name);
  if (existing) return existing.id;

  const newList = await trelloFetch("/lists", {
    method: "POST",
    body: JSON.stringify({ name, idBoard: boardId }),
  }) as { id: string };
  return newList.id;
}

export async function createCard(listId: string, post: ContentPost): Promise<string> {
  const platformLabel = post.platforms && post.platforms.length > 0
    ? ` | ${post.platforms.join(" + ")}`
    : "";

  const card = await trelloFetch("/cards", {
    method: "POST",
    body: JSON.stringify({
      idList: listId,
      name: `[${post.format}] Dia ${post.day}${platformLabel} — ${post.theme}`,
      desc: [
        `**Plataformas:** ${post.platforms?.join(", ") ?? post.format}`,
        `**Gancho:** ${post.hook}`,
        `**Objetivo:** ${post.objective}`,
        `**Por que este conteúdo:** ${post.rationale ?? ""}`,
        post.storiesIdea ? `**Stories do dia:** ${post.storiesIdea}` : "",
        post.notes ? `**Obs:** ${post.notes}` : "",
      ].filter(Boolean).join("\n\n"),
      due: post.date ? new Date(post.date).toISOString() : undefined,
    }),
  }) as { id: string };
  return card.id;
}

export async function syncCalendarToTrello(
  client: Client,
  calendar: ContentCalendar
): Promise<void> {
  let boardId = client.trelloBoardId;

  if (!boardId) {
    console.log(`📋 Criando board Trello para ${client.brandName}...`);
    boardId = await createBoard(client.brandName);
    await upsertClient({ ...client, trelloBoardId: boardId });
    console.log(`✅ Board criado: ${boardId}`);
  }

  const byWeek: Record<number, ContentPost[]> = {};
  for (const post of calendar.posts) {
    if (!byWeek[post.week]) byWeek[post.week] = [];
    byWeek[post.week].push(post);
  }

  // Criar cards nas listas de semana (Semana 1, 2, 3, 4)
  for (const week of [1, 2, 3, 4]) {
    const posts = byWeek[week] ?? [];
    if (!posts.length) continue;
    const listId = await getOrCreateList(boardId, `Semana ${week}`);
    for (const post of posts.sort((a, b) => a.day - b.day)) {
      await createCard(listId, post);
    }
    console.log(`✅ Semana ${week}: ${posts.length} cards criados`);
  }

  console.log(`✅ Calendário sincronizado no Trello para ${client.name}`);
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  idList: string;
  url: string;
}

export interface TrelloList {
  id: string;
  name: string;
}

export async function getBoardCards(boardId: string): Promise<{ cards: TrelloCard[]; lists: TrelloList[] }> {
  const [cards, lists] = await Promise.all([
    trelloFetch(`/boards/${boardId}/cards?fields=id,name,desc,due,idList,url`) as Promise<TrelloCard[]>,
    trelloFetch(`/boards/${boardId}/lists?fields=id,name`) as Promise<TrelloList[]>,
  ]);
  return { cards, lists };
}
