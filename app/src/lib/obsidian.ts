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

export function writeNote(clientId: string, filename: string, content: string): void {
  const clientPath = ensureClientFolder(clientId);
  fs.writeFileSync(path.join(clientPath, filename), content, "utf-8");
}

export function readNote(clientId: string, filename: string): string | null {
  const filePath = path.join(getClientPath(clientId), filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function writeCalendar(clientId: string, month: string, content: string): void {
  const calPath = path.join(getVaultPath(), "03 - Calendários");
  fs.mkdirSync(calPath, { recursive: true });
  fs.writeFileSync(path.join(calPath, `${clientId}-${month}.md`), content, "utf-8");
}
