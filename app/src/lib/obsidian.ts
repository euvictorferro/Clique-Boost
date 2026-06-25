import fs from "fs";
import path from "path";

// Quando GITHUB_VAULT_REPO está definido, usa GitHub API (produção na Vercel).
// Caso contrário, usa filesystem local (desenvolvimento).
const USE_GITHUB = !!process.env.GITHUB_VAULT_REPO;
const GITHUB_REPO  = process.env.GITHUB_VAULT_REPO ?? "";   // ex: "euvictorferro/clique-boost-vault"
const GITHUB_TOKEN = process.env.GITHUB_VAULT_TOKEN ?? "";
const GITHUB_BRANCH = process.env.GITHUB_VAULT_BRANCH ?? "main";

// ─── GitHub API helpers ───────────────────────────────────────────────────────

async function githubGetFile(repoPath: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(repoPath)}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${repoPath} → ${res.status}`);
  const data = await res.json() as { content: string };
  return Buffer.from(data.content, "base64").toString("utf-8");
}

async function githubPutFile(repoPath: string, content: string): Promise<void> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(repoPath)}`;

  // Busca SHA atual (necessário para update)
  let sha: string | undefined;
  const getRes = await fetch(url + `?ref=${GITHUB_BRANCH}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (getRes.ok) {
    const existing = await getRes.json() as { sha: string };
    sha = existing.sha;
  }

  const body: Record<string, string> = {
    message: `vault: update ${repoPath.split("/").pop()}`,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`GitHub PUT ${repoPath} → ${putRes.status}: ${err}`);
  }
}

// ─── Paths ───────────────────────────────────────────────────────────────────

function getVaultPath(): string {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) throw new Error("OBSIDIAN_VAULT_PATH not set");
  return vaultPath;
}

export function getClientPath(clientId: string): string {
  return path.join(getVaultPath(), "01 - Clientes", clientId);
}

export function ensureClientFolder(clientId: string): string {
  if (USE_GITHUB) return `01 - Clientes/${clientId}`;
  const clientPath = getClientPath(clientId);
  fs.mkdirSync(clientPath, { recursive: true });
  return clientPath;
}

// Mapa de arquivo → subpasta dentro do cliente
const SUBFOLDER: Record<string, string> = {
  "briefing.md":                    "Briefing",
  "ICP.md":                         "Estratégia",
  "estrategia-conteudo.md":         "Estratégia",
  "funil-organico.md":              "Estratégia",
  "mapa-mental.md":                 "Estratégia",
  "mapa-mental-posicionamento.md":  "Estratégia",
  "linha-editorial.md":             "Estratégia",
  "produtos-copys.md":              "Estratégia",
  "perfil.md":                      "Estratégia",
  "paleta.md":                      "Branding",
  "concorrentes.md":                "Branding",
  "analise-perfis.md":              "Branding",
  "voz.md":                         "Estratégia",
};

function resolveRepoPath(clientId: string, filename: string): string {
  const subfolder = SUBFOLDER[filename];
  const base = `01 - Clientes/${clientId}`;
  return subfolder ? `${base}/${subfolder}/${filename}` : `${base}/${filename}`;
}

function resolveLocalPath(clientId: string, filename: string): string {
  const subfolder = SUBFOLDER[filename];
  const clientPath = getClientPath(clientId);
  return subfolder
    ? path.join(clientPath, subfolder, filename)
    : path.join(clientPath, filename);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function writeNote(clientId: string, filename: string, content: string): void {
  if (USE_GITHUB) {
    githubPutFile(resolveRepoPath(clientId, filename), content).catch(console.error);
    return;
  }
  const filePath = resolveLocalPath(clientId, filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

export function readNote(clientId: string, filename: string): string | null {
  if (USE_GITHUB) {
    // readNote precisa ser async — retorna null sincronamente em contextos síncronos legados
    // Idealmente chamar readNoteAsync
    return null;
  }
  const filePath = resolveLocalPath(clientId, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export async function readNoteAsync(clientId: string, filename: string): Promise<string | null> {
  if (USE_GITHUB) return githubGetFile(resolveRepoPath(clientId, filename));
  return readNote(clientId, filename);
}

export async function writeNoteAsync(clientId: string, filename: string, content: string): Promise<void> {
  if (USE_GITHUB) return githubPutFile(resolveRepoPath(clientId, filename), content);
  writeNote(clientId, filename, content);
}

export function writeCalendar(clientId: string, month: string, content: string): void {
  if (USE_GITHUB) {
    githubPutFile(`01 - Clientes/${clientId}/Calendários/${month}.md`, content).catch(console.error);
    return;
  }
  const calPath = path.join(getClientPath(clientId), "Calendários");
  fs.mkdirSync(calPath, { recursive: true });
  fs.writeFileSync(path.join(calPath, `${month}.md`), content, "utf-8");
}

export function readCalendar(clientId: string, month: string): string | null {
  if (USE_GITHUB) return null;
  const filePath = path.join(getClientPath(clientId), "Calendários", `${month}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export async function readCalendarAsync(clientId: string, month: string): Promise<string | null> {
  if (USE_GITHUB) return githubGetFile(`01 - Clientes/${clientId}/Calendários/${month}.md`);
  return readCalendar(clientId, month);
}

export function writeAnalysis(clientId: string, weekLabel: string, content: string): void {
  if (USE_GITHUB) {
    githubPutFile(`01 - Clientes/${clientId}/Análises/${weekLabel}.md`, content).catch(console.error);
    return;
  }
  const dir = path.join(getClientPath(clientId), "Análises");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${weekLabel}.md`), content, "utf-8");
}

export function writeMeeting(clientId: string, filename: string, content: string): void {
  if (USE_GITHUB) {
    githubPutFile(`01 - Clientes/${clientId}/Reuniões/${filename}`, content).catch(console.error);
    return;
  }
  const dir = path.join(getClientPath(clientId), "Reuniões");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content, "utf-8");
}
