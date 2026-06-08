"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";

interface Job {
  id: string;
  name: string;
  frequency: string;
  nextRun: string;
  lastStatus: "success" | "error" | "running" | "never";
  lastDuration?: string;
}

const JOBS: Job[] = [
  {
    id: "calendar",
    name: "Calendário Mensal",
    frequency: "Todo dia 1",
    nextRun: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      return d.toLocaleDateString("pt-BR");
    })(),
    lastStatus: "success",
    lastDuration: "2m 14s",
  },
  {
    id: "weekly-refresh",
    name: "Refresh Semanal",
    frequency: "Toda segunda",
    nextRun: (() => {
      const d = new Date();
      const day = d.getDay();
      const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7;
      d.setDate(d.getDate() + daysUntilMonday);
      return d.toLocaleDateString("pt-BR");
    })(),
    lastStatus: "success",
    lastDuration: "4m 02s",
  },
  {
    id: "metrics",
    name: "Coleta de Métricas",
    frequency: "Todo dia",
    nextRun: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString("pt-BR");
    })(),
    lastStatus: "success",
    lastDuration: "0m 38s",
  },
];

const STATUS_BADGE: Record<string, string> = {
  success: "bg-[#d1fae5] text-[#059669]",
  error: "bg-[#fee2e2] text-[#e11d48]",
  running: "bg-[#fef3c7] text-[#d97706]",
  never: "bg-[#f5f5f5] text-[#888]",
};

const STATUS_LABEL: Record<string, string> = {
  success: "✅ Sucesso",
  error: "🔴 Erro",
  running: "🟡 Rodando",
  never: "— Nunca",
};

export function JobsTable() {
  const [running, setRunning] = useState<string | null>(null);

  const triggerJob = async (jobId: string) => {
    setRunning(jobId);
    try {
      await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: jobId }),
      });
    } finally {
      setTimeout(() => setRunning(null), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#f5f5f5]">
            {["Job", "Frequência", "Próxima Execução", "Último Status", "Duração", ""].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-[#888] px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {JOBS.map((job) => (
            <tr key={job.id} className="border-b border-[#f5f5f5] last:border-0">
              <td className="px-4 py-3 text-sm font-medium text-[#111]">{job.name}</td>
              <td className="px-4 py-3 text-sm text-[#555]">{job.frequency}</td>
              <td className="px-4 py-3 text-sm text-[#555]">{job.nextRun}</td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[job.lastStatus]}`}>
                  {STATUS_LABEL[job.lastStatus]}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-[#888]">{job.lastDuration ?? "—"}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => triggerJob(job.id)}
                  disabled={running === job.id}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors disabled:opacity-50"
                >
                  {running === job.id ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                  {running === job.id ? "Rodando…" : "Rodar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
