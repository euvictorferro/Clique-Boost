import { supabase } from "./supabase";

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
  details?: LogDetail[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEntry(row: any): LogEntry {
  return {
    id: row.id,
    date: row.date,
    job: row.job,
    clientId: row.client_id,
    clientName: row.client_name ?? undefined,
    status: row.status,
    message: row.message ?? "",
    durationMs: row.duration_ms ?? undefined,
    details: row.details ?? undefined,
  };
}

export async function readLog(): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from("pipeline_logs")
    .select("*")
    .order("date", { ascending: false })
    .limit(200);
  if (error) throw new Error(`readLog: ${error.message}`);
  return (data ?? []).map(rowToEntry);
}

export async function appendLog(entry: Omit<LogEntry, "id">): Promise<LogEntry> {
  const id = Date.now().toString();
  const row = {
    id,
    date: entry.date,
    job: entry.job,
    client_id: entry.clientId,
    client_name: entry.clientName ?? null,
    status: entry.status,
    message: entry.message,
    duration_ms: entry.durationMs ?? null,
    details: entry.details ?? null,
  };
  const { error } = await supabase.from("pipeline_logs").insert(row);
  if (error) throw new Error(`appendLog: ${error.message}`);
  return { id, ...entry };
}

export async function updateLog(id: string, patch: Partial<LogEntry>): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.message !== undefined) update.message = patch.message;
  if (patch.durationMs !== undefined) update.duration_ms = patch.durationMs;
  if (patch.details !== undefined) update.details = patch.details;
  const { error } = await supabase.from("pipeline_logs").update(update).eq("id", id);
  if (error) throw new Error(`updateLog(${id}): ${error.message}`);
}
