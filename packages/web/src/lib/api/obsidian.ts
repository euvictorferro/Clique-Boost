/**
 * Storage de documentos de clientes.
 *
 * Supabase é a fonte de verdade (tabela client_documents).
 * Obsidian/GitHub recebe uma cópia para leitura humana quando disponível.
 */

import fs from "fs";
import path from "path";
import { supabase } from "./supabase";

const USE_GITHUB = !!process.env.GITHUB_VAULT_REPO;
const GITHUB_REPO = process.env.GITHUB_VAULT_REPO ?? "";
const GITHUB_TOKEN = process.env.GITHUB_VAULT_TOKEN ?? "";
const GITHUB_BRANCH = process.env.GITHUB_VAULT_BRANCH ?? "main";

// ─── GitHub sync (fire-and-forget) ───────────────────────────────────────────

async function githubPutFile(repoPath: string, content: string): Promise<void> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(repoPath)}`;
  let sha: string | undefined;
  const getRes = await fetch(`${url}?ref=${GITHUB_BRANCH}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (getRes.ok) sha = ((await getRes.json()) as { sha: string }).sha;

  const body: Record<string, string> = {
    message: `vault: update ${repoPath.split("/").pop()}`,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function githubGetFile(repoPath: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(repoPath)}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as { content: string };
  return Buffer.from(data.content, "base64").toString("utf-8");
}

// ─── Local filesystem sync ────────────────────────────────────────────────────

const SUBFOLDER: Record<string, string> = {
  "briefing.md": "Briefing",
  "ICP.md": "Estratégia",
  "estrategia-conteudo.md": "Estratégia",
  "funil-organico.md": "Estratégia",
  "mapa-mental.md": "Estratégia",
  "mapa-mental-posicionamento.md": "Estratégia",
  "linha-editorial.md": "Estratégia",
  "produtos-copys.md": "Estratégia",
  "perfil.md": "Estratégia",
  "voz.md": "Estratégia",
  "paleta.md": "Branding",
  "concorrentes.md": "Branding",
  "analise-perfis.md": "Branding",
  "brand-guidelines.md": "Branding",
};

function getVaultPath(): string | null {
  return process.env.OBSIDIAN_VAULT_PATH ?? null;
}

function localWrite(clientId: string, filename: string, content: string): void {
  const vaultPath = getVaultPath();
  if (!vaultPath) return;
  const subfolder = SUBFOLDER[filename];
  const base = path.join(vaultPath, "01 - Clientes", clientId);
  const filePath = subfolder ? path.join(base, subfolder, filename) : path.join(base, filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

function localRead(clientId: string, filename: string): string | null {
  const vaultPath = getVaultPath();
  if (!vaultPath) return null;
  const subfolder = SUBFOLDER[filename];
  const base = path.join(vaultPath, "01 - Clientes", clientId);
  const filePath = subfolder ? path.join(base, subfolder, filename) : path.join(base, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

// ─── Supabase storage ─────────────────────────────────────────────────────────

function filenameToDocType(filename: string): string {
  const map: Record<string, string> = {
    "briefing.md": "briefing",
    "ICP.md": "icp",
    "paleta.md": "palette",
    "brand-guidelines.md": "brand-guidelines",
    "estrategia-conteudo.md": "strategy",
    "funil-organico.md": "funnel",
    "mapa-mental.md": "mental-map",
    "mapa-mental-posicionamento.md": "mental-map-positioning",
    "concorrentes.md": "competitors",
    "analise-perfis.md": "profile-analysis",
    "voz.md": "voice",
    "linha-editorial.md": "editorial-line",
    "produtos-copys.md": "products-copy",
    "perfil.md": "profile",
  };
  return map[filename] ?? filename.replace(".md", "");
}

async function supabaseWrite(clientId: string, docType: string, content: string, extra?: { month?: string; weekLabel?: string }): Promise<void> {
  const month = extra?.month ?? null;
  const weekLabel = extra?.weekLabel ?? null;

  // Check if record exists
  let q = supabase
    .from("client_documents")
    .select("id")
    .eq("client_id", clientId)
    .eq("doc_type", docType);
  if (month) q = q.eq("month", month); else q = q.is("month", null);
  if (weekLabel) q = q.eq("week_label", weekLabel); else q = q.is("week_label", null);
  const { data: existing } = await q.maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("client_documents")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) console.error(`supabaseWrite update(${clientId}/${docType}):`, error.message);
  } else {
    const { error } = await supabase.from("client_documents").insert({
      client_id: clientId,
      doc_type: docType,
      content,
      month,
      week_label: weekLabel,
    });
    if (error) console.error(`supabaseWrite insert(${clientId}/${docType}):`, error.message);
  }
}

async function supabaseRead(clientId: string, docType: string, extra?: { month?: string; weekLabel?: string }): Promise<string | null> {
  let q = supabase
    .from("client_documents")
    .select("content")
    .eq("client_id", clientId)
    .eq("doc_type", docType);
  if (extra?.month) q = q.eq("month", extra.month);
  else q = q.is("month", null);
  if (extra?.weekLabel) q = q.eq("week_label", extra.weekLabel);
  else q = q.is("week_label", null);
  const { data, error } = await q.single();
  if (error?.code === "PGRST116") return null;
  if (error) { console.error(`supabaseRead(${clientId}/${docType}):`, error.message); return null; }
  return data?.content ?? null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getClientPath(clientId: string): string {
  const vaultPath = getVaultPath();
  if (!vaultPath) return "";
  return path.join(vaultPath, "01 - Clientes", clientId);
}

export function ensureClientFolder(clientId: string): string {
  if (USE_GITHUB) return `01 - Clientes/${clientId}`;
  const vaultPath = getVaultPath();
  if (vaultPath) {
    const p = path.join(vaultPath, "01 - Clientes", clientId);
    fs.mkdirSync(p, { recursive: true });
    return p;
  }
  return "";
}

export function writeNote(clientId: string, filename: string, content: string): void {
  const docType = filenameToDocType(filename);
  supabaseWrite(clientId, docType, content).catch(console.error);

  if (USE_GITHUB) {
    const subfolder = SUBFOLDER[filename];
    const repoPath = subfolder
      ? `01 - Clientes/${clientId}/${subfolder}/${filename}`
      : `01 - Clientes/${clientId}/${filename}`;
    githubPutFile(repoPath, content).catch(console.error);
  } else {
    localWrite(clientId, filename, content);
  }
}

export async function writeNoteAsync(clientId: string, filename: string, content: string): Promise<void> {
  const docType = filenameToDocType(filename);
  await supabaseWrite(clientId, docType, content);

  if (USE_GITHUB) {
    const subfolder = SUBFOLDER[filename];
    const repoPath = subfolder
      ? `01 - Clientes/${clientId}/${subfolder}/${filename}`
      : `01 - Clientes/${clientId}/${filename}`;
    await githubPutFile(repoPath, content);
  } else {
    localWrite(clientId, filename, content);
  }
}

export function readNote(clientId: string, filename: string): string | null {
  return localRead(clientId, filename);
}

export async function readNoteAsync(clientId: string, filename: string): Promise<string | null> {
  const docType = filenameToDocType(filename);
  const fromSupabase = await supabaseRead(clientId, docType);
  if (fromSupabase) return fromSupabase;
  if (USE_GITHUB) {
    const subfolder = SUBFOLDER[filename];
    const repoPath = subfolder
      ? `01 - Clientes/${clientId}/${subfolder}/${filename}`
      : `01 - Clientes/${clientId}/${filename}`;
    return githubGetFile(repoPath);
  }
  return localRead(clientId, filename);
}

export function writeCalendar(clientId: string, month: string, content: string): void {
  supabaseWrite(clientId, "calendar", content, { month }).catch(console.error);

  if (USE_GITHUB) {
    githubPutFile(`01 - Clientes/${clientId}/Calendários/${month}.md`, content).catch(console.error);
  } else {
    const vaultPath = getVaultPath();
    if (vaultPath) {
      const dir = path.join(vaultPath, "01 - Clientes", clientId, "Calendários");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${month}.md`), content, "utf-8");
    }
  }
}

export async function readCalendarAsync(clientId: string, month: string): Promise<string | null> {
  const fromSupabase = await supabaseRead(clientId, "calendar", { month });
  if (fromSupabase) return fromSupabase;
  if (USE_GITHUB) return githubGetFile(`01 - Clientes/${clientId}/Calendários/${month}.md`);
  const vaultPath = getVaultPath();
  if (!vaultPath) return null;
  const filePath = path.join(vaultPath, "01 - Clientes", clientId, "Calendários", `${month}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function readCalendar(clientId: string, month: string): string | null {
  const vaultPath = getVaultPath();
  if (!vaultPath) return null;
  const filePath = path.join(vaultPath, "01 - Clientes", clientId, "Calendários", `${month}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function writeAnalysis(clientId: string, weekLabel: string, content: string): void {
  supabaseWrite(clientId, "analysis", content, { weekLabel }).catch(console.error);

  if (USE_GITHUB) {
    githubPutFile(`01 - Clientes/${clientId}/Análises/${weekLabel}.md`, content).catch(console.error);
  } else {
    const vaultPath = getVaultPath();
    if (vaultPath) {
      const dir = path.join(vaultPath, "01 - Clientes", clientId, "Análises");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${weekLabel}.md`), content, "utf-8");
    }
  }
}

export function writeMeeting(clientId: string, filename: string, content: string): void {
  if (USE_GITHUB) {
    githubPutFile(`01 - Clientes/${clientId}/Reuniões/${filename}`, content).catch(console.error);
  } else {
    const vaultPath = getVaultPath();
    if (vaultPath) {
      const dir = path.join(vaultPath, "01 - Clientes", clientId, "Reuniões");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, filename), content, "utf-8");
    }
  }
}
