import fs from "fs";
import path from "path";

function getVaultPath(): string {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) throw new Error("OBSIDIAN_VAULT_PATH not set");
  return vaultPath;
}

export function getClientPath(clientId: string): string {
  return path.join(getVaultPath(), "01 - Clientes", clientId);
}

export function ensureClientFolder(clientId: string): string {
  const clientPath = getClientPath(clientId);
  fs.mkdirSync(clientPath, { recursive: true });
  return clientPath;
}

// Mapa de arquivo → subpasta dentro do cliente
const SUBFOLDER: Record<string, string> = {
  "briefing.md":                "Briefing",
  "ICP.md":                     "Estratégia",
  "estrategia-conteudo.md":     "Estratégia",
  "funil-organico.md":          "Estratégia",
  "mapa-mental.md":             "Estratégia",
  "mapa-mental-posicionamento.md": "Estratégia",
  "linha-editorial.md":         "Estratégia",
  "produtos-copys.md":          "Estratégia",
  "perfil.md":                  "Estratégia",
  "paleta.md":                  "Branding",
  "concorrentes.md":            "Branding",
  "analise-perfis.md":          "Branding",
  "voz.md":                     "Estratégia",
};

function resolveNotePath(clientId: string, filename: string): string {
  const subfolder = SUBFOLDER[filename];
  const clientPath = getClientPath(clientId);
  if (subfolder) {
    return path.join(clientPath, subfolder, filename);
  }
  // Fallback: raiz da pasta do cliente
  return path.join(clientPath, filename);
}

export function writeNote(clientId: string, filename: string, content: string): void {
  const filePath = resolveNotePath(clientId, filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

export function readNote(clientId: string, filename: string): string | null {
  const filePath = resolveNotePath(clientId, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function writeCalendar(clientId: string, month: string, content: string): void {
  const calPath = path.join(getClientPath(clientId), "Calendários");
  fs.mkdirSync(calPath, { recursive: true });
  fs.writeFileSync(path.join(calPath, `${month}.md`), content, "utf-8");
}

export function readCalendar(clientId: string, month: string): string | null {
  const filePath = path.join(getClientPath(clientId), "Calendários", `${month}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function writeAnalysis(clientId: string, weekLabel: string, content: string): void {
  const dir = path.join(getClientPath(clientId), "Análises");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${weekLabel}.md`), content, "utf-8");
}

export function writeMeeting(clientId: string, filename: string, content: string): void {
  const dir = path.join(getClientPath(clientId), "Reuniões");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content, "utf-8");
}
