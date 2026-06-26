import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), "..", "..", "data", "pipeline-logs.json");

export interface LogDetail {
  label: string;
  value: string | number;
}

export interface LogEntry {
  id: string;
  date: string;
  job: string;
  clientId: string;
  clientName?: string;
  status: "success" | "error" | "running";
  message: string;
  durationMs?: number;
  details?: LogDetail[]; // e.g. [{ label: "Seguidores", value: 12400 }, ...]
}

export function readLog(): LogEntry[] {
  if (!existsSync(LOG_PATH)) return [];
  try {
    return JSON.parse(readFileSync(LOG_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function appendLog(entry: Omit<LogEntry, "id">): LogEntry {
  const log = readLog();
  const full: LogEntry = { id: Date.now().toString(), ...entry };
  const updated = [full, ...log].slice(0, 200); // keep last 200 entries
  writeFileSync(LOG_PATH, JSON.stringify(updated, null, 2), "utf-8");
  return full;
}

export function updateLog(id: string, patch: Partial<LogEntry>): void {
  const log = readLog();
  const idx = log.findIndex((e) => e.id === id);
  if (idx !== -1) {
    log[idx] = { ...log[idx], ...patch };
    writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), "utf-8");
  }
}
