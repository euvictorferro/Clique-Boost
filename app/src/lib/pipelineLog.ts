import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), "..", "data", "pipeline-log.json");

export interface LogEntry {
  id: string;
  date: string;
  job: string;
  clientId: string;
  status: "success" | "error" | "running";
  message: string;
  durationMs?: number;
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
  const updated = [full, ...log].slice(0, 100);
  writeFileSync(LOG_PATH, JSON.stringify(updated, null, 2), "utf-8");
  return full;
}
