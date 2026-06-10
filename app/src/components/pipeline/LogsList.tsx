"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";

interface LogDetail {
  label: string;
  value: string | number;
}

interface LogEntry {
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

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  success: { badge: "bg-[#d1fae5] text-[#059669]", dot: "bg-[#10b981]" },
  error:   { badge: "bg-[#fee2e2] text-[#e11d48]", dot: "bg-[#e11d48]" },
  running: { badge: "bg-[#fef3c7] text-[#d97706]", dot: "bg-[#f59e0b] animate-pulse" },
};

const STATUS_LABEL: Record<string, string> = {
  success: "Sucesso",
  error: "Erro",
  running: "Rodando",
};

const JOB_LABEL: Record<string, string> = {
  metrics: "Coleta de Métricas",
  "weekly-refresh": "Refresh Semanal",
  calendar: "Calendário",
};

function fmtDuration(ms?: number) {
  if (!ms) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function LogRow({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_STYLES[log.status] ?? STATUS_STYLES.running;
  const hasDetails = log.details && log.details.length > 0;

  return (
    <>
      <tr
        className={`border-b border-[#f5f5f5] last:border-0 ${hasDetails ? "cursor-pointer hover:bg-[#fafafa]" : ""}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <td className="px-4 py-2.5 text-xs text-[#888] whitespace-nowrap">
          {new Date(log.date).toLocaleString("pt-BR", {
            day: "2-digit", month: "2-digit",
            hour: "2-digit", minute: "2-digit",
          })}
        </td>
        <td className="px-4 py-2.5 text-xs font-medium text-[#333]">
          {JOB_LABEL[log.job] ?? log.job}
        </td>
        <td className="px-4 py-2.5 text-xs text-[#555]">
          {log.clientName ?? (log.clientId === "all" ? "Todos" : log.clientId)}
        </td>
        <td className="px-4 py-2.5">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${s.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {STATUS_LABEL[log.status]}
          </span>
        </td>
        <td className="px-4 py-2.5 text-xs text-[#555] max-w-[220px] truncate">{log.message}</td>
        <td className="px-4 py-2.5 text-xs text-[#888]">{fmtDuration(log.durationMs) ?? "—"}</td>
        <td className="px-4 py-2.5 w-6">
          {hasDetails && (
            <span className="text-[#bbb]">
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
          )}
        </td>
      </tr>

      {expanded && hasDetails && (
        <tr className="bg-[#fafafa] border-b border-[#f5f5f5]">
          <td colSpan={7} className="px-6 py-3">
            <div className="flex flex-wrap gap-3">
              {log.details!.map((d, i) => (
                <div key={i} className="bg-white border border-[#e5e5e5] rounded-lg px-3 py-2 min-w-[100px]">
                  <p className="text-[10px] text-[#888] mb-0.5">{d.label}</p>
                  <p className="text-sm font-semibold text-[#111]">{d.value}</p>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export const LogsList = forwardRef<{ reload: () => void }>(function LogsList(_, ref) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all"); // "all" | "today" | "7d" | "30d"

  const load = () => {
    setLoading(true);
    fetch("/api/pipeline/logs")
      .then((r) => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  };

  useImperativeHandle(ref, () => ({ reload: load }));

  useEffect(() => { load(); }, []);

  // Auto-refresh while any job is "running"
  useEffect(() => {
    const hasRunning = logs.some((l) => l.status === "running");
    if (!hasRunning) return;
    const t = setTimeout(load, 2000);
    return () => clearTimeout(t);
  }, [logs]);

  const jobTypes = ["all", ...Array.from(new Set(logs.map((l) => l.job)))];

  const now = Date.now();
  const DATE_FILTERS: Record<string, (l: LogEntry) => boolean> = {
    all: () => true,
    today: (l) => new Date(l.date).toDateString() === new Date().toDateString(),
    "7d": (l) => now - new Date(l.date).getTime() <= 7 * 86400000,
    "30d": (l) => now - new Date(l.date).getTime() <= 30 * 86400000,
  };

  const filtered = logs
    .filter((l) => filter === "all" || l.job === filter)
    .filter(DATE_FILTERS[dateFilter] ?? (() => true));

  if (loading && !logs.length) return <p className="text-sm text-[#888] py-4">Carregando logs…</p>;

  if (!logs.length) return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center">
      <p className="text-sm text-[#888]">Nenhuma execução registrada ainda.</p>
      <p className="text-xs text-[#bbb] mt-1">Rode um job acima para ver o histórico aqui.</p>
    </div>
  );

  return (
    <div>
      {/* Filters + refresh */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {/* Job filter */}
        <div className="flex gap-1">
          {jobTypes.map((j) => (
            <button
              key={j}
              onClick={() => setFilter(j)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === j
                  ? "bg-[#8b5cf6] text-white"
                  : "bg-white border border-[#e5e5e5] text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
              }`}
            >
              {j === "all" ? "Todos os jobs" : (JOB_LABEL[j] ?? j)}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-[#e5e5e5]" />

        {/* Date filter */}
        <div className="flex gap-1">
          {[
            { key: "today", label: "Hoje" },
            { key: "7d", label: "7 dias" },
            { key: "30d", label: "30 dias" },
            { key: "all", label: "Tudo" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                dateFilter === key
                  ? "bg-[#111] text-white"
                  : "bg-white border border-[#e5e5e5] text-[#555] hover:border-[#333] hover:text-[#111]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={load}
          className="ml-auto flex items-center gap-1.5 text-xs text-[#888] hover:text-[#333] transition-colors"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
        <span className="text-xs text-[#bbb]">{filtered.length} entradas</span>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f5]">
              {["Data", "Job", "Cliente", "Status", "Mensagem", "Duração", ""].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-[#888] px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
