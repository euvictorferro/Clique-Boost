"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: string;
  date: string;
  job: string;
  clientId: string;
  status: "success" | "error" | "running";
  message: string;
  durationMs?: number;
}

const STATUS_BADGE: Record<string, string> = {
  success: "bg-[#d1fae5] text-[#059669]",
  error: "bg-[#fee2e2] text-[#e11d48]",
  running: "bg-[#fef3c7] text-[#d97706]",
};

const STATUS_ICON: Record<string, string> = {
  success: "✅",
  error: "🔴",
  running: "🟡",
};

export function LogsList() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pipeline/logs")
      .then((r) => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[#888] py-4">Carregando logs…</p>;
  if (!logs.length) return <p className="text-sm text-[#888] py-4">Nenhuma execução registrada.</p>;

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#f5f5f5]">
            {["Data", "Job", "Cliente", "Status", "Mensagem"].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-[#888] px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.slice(0, 20).map((log) => (
            <tr key={log.id} className="border-b border-[#f5f5f5] last:border-0">
              <td className="px-4 py-2.5 text-xs text-[#888] whitespace-nowrap">
                {new Date(log.date).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-2.5 text-xs font-medium text-[#333]">{log.job}</td>
              <td className="px-4 py-2.5 text-xs text-[#555]">{log.clientId}</td>
              <td className="px-4 py-2.5">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[log.status]}`}>
                  {STATUS_ICON[log.status]} {log.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-[#555] max-w-xs truncate">{log.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
