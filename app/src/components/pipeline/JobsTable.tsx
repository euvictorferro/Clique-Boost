"use client";

import { useState, useEffect } from "react";
import { Play, Loader2, RefreshCw } from "lucide-react";

interface LogEntry {
  id: string;
  date: string;
  job: string;
  status: "success" | "error" | "running";
  durationMs?: number;
}

interface Job {
  id: string;
  name: string;
  frequency: string;
  nextRun: string;
  description: string;
}

const JOBS: Job[] = [
  {
    id: "calendar",
    name: "📅 Geração de Calendário Mensal",
    frequency: "Todo dia 1",
    nextRun: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      return d.toLocaleDateString("pt-BR");
    })(),
    description: "Gera 20–25 posts/cliente com Claude (ICP + estratégia + concorrentes) e cria cards no Trello. Roda para todos os clientes.",
  },
  {
    id: "metrics",
    name: "📊 Coleta de Métricas",
    frequency: "Todo dia às 7h",
    nextRun: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(7, 0, 0, 0);
      return d.toLocaleDateString("pt-BR");
    })(),
    description: "Busca seguidores, alcance, impressões, engajamento e top posts de cada cliente via Meta API.",
  },
  {
    id: "weekly-analysis",
    name: "🔍 Análise Semanal",
    frequency: "Toda sexta às 9h",
    nextRun: (() => {
      const d = new Date();
      const day = d.getDay();
      const daysUntilFri = day <= 5 ? 5 - day : 6;
      d.setDate(d.getDate() + (daysUntilFri || 7));
      return d.toLocaleDateString("pt-BR");
    })(),
    description: "Analisa posts da semana: top performers, flopped posts, padrões. Gera relatório com recomendações e salva no Obsidian.",
  },
  {
    id: "weekly-refresh",
    name: "🔄 Refresh Semanal de Conteúdo",
    frequency: "Toda sexta às 9h30",
    nextRun: (() => {
      const d = new Date();
      const day = d.getDay();
      const daysUntilFri = day <= 5 ? 5 - day : 6;
      d.setDate(d.getDate() + (daysUntilFri || 7));
      return d.toLocaleDateString("pt-BR");
    })(),
    description: "Com base na análise + trending de concorrentes, substitui posts da próxima semana por conteúdos mais relevantes.",
  },
  {
    id: "weekly-full",
    name: "⚡ Ciclo Semanal Completo",
    frequency: "Manual ou toda sexta",
    nextRun: (() => {
      const d = new Date();
      const day = d.getDay();
      const daysUntilFri = day <= 5 ? 5 - day : 6;
      d.setDate(d.getDate() + (daysUntilFri || 7));
      return d.toLocaleDateString("pt-BR");
    })(),
    description: "Executa Análise + Refresh em sequência para todos os clientes. Recomendado rodar manualmente toda sexta.",
  },
];

const STATUS_BADGE: Record<string, string> = {
  success: "bg-[#d1fae5] text-[#059669]",
  error: "bg-[#fee2e2] text-[#e11d48]",
  running: "bg-[#fef3c7] text-[#d97706]",
  never: "bg-[#f5f5f5] text-[#888]",
};

const STATUS_LABEL: Record<string, string> = {
  success: "Sucesso",
  error: "Erro",
  running: "Rodando…",
  never: "Nunca executado",
};

function fmtDuration(ms?: number) {
  if (!ms) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function JobsTable({ onJobRun }: { onJobRun?: () => void }) {
  const [running, setRunning] = useState<string | null>(null);
  const [lastRuns, setLastRuns] = useState<Record<string, LogEntry>>({});

  const loadLastRuns = () => {
    fetch("/api/pipeline/logs")
      .then((r) => r.json())
      .then((logs: LogEntry[]) => {
        const map: Record<string, LogEntry> = {};
        for (const log of logs) {
          if (!map[log.job]) map[log.job] = log; // logs are newest first
        }
        setLastRuns(map);
      })
      .catch(() => {});
  };

  useEffect(() => { loadLastRuns(); }, []);

  const triggerJob = async (jobId: string) => {
    setRunning(jobId);
    await fetch("/api/pipeline/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job: jobId }),
    });
    // Jobs longos (calendar, weekly-full) podem demorar até 3 min
    const isLongJob = ["calendar", "weekly-full", "weekly-analysis", "weekly-refresh"].includes(jobId);
    const maxWait = isLongJob ? 180_000 : 20_000;
    const poll = setInterval(() => {
      loadLastRuns();
      onJobRun?.();
    }, 2500);
    setTimeout(() => {
      clearInterval(poll);
      setRunning(null);
      loadLastRuns();
      onJobRun?.();
    }, maxWait);
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#f5f5f5]">
            {["Job", "Frequência", "Próxima Execução", "Último Status", "Última Execução", "Duração", ""].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-[#888] px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {JOBS.map((job) => {
            const last = lastRuns[job.id];
            const status = running === job.id ? "running" : (last?.status ?? "never");
            const s = STATUS_BADGE[status] ?? STATUS_BADGE.never;

            return (
              <tr key={job.id} className="border-b border-[#f5f5f5] last:border-0 group">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-[#111]">{job.name}</p>
                  <p className="text-[10px] text-[#888] mt-0.5 max-w-xs">{job.description}</p>
                </td>
                <td className="px-4 py-3 text-sm text-[#555]">{job.frequency}</td>
                <td className="px-4 py-3 text-sm text-[#555]">{job.nextRun}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s}`}>
                    {STATUS_LABEL[status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#888]">
                  {last ? fmtDate(last.date) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-[#888]">
                  {last ? (fmtDuration(last.durationMs) ?? "—") : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => triggerJob(job.id)}
                    disabled={!!running}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors disabled:opacity-40"
                  >
                    {running === job.id
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Play size={11} />}
                    {running === job.id ? "Rodando…" : "Rodar"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
