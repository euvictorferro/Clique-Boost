"use client";

import { useEffect, useState, useCallback, use } from "react";
import { CalendarView } from "@/components/client/CalendarView";
import { RefreshCw } from "lucide-react";

const AUTO_REFRESH_MS = 5 * 60 * 1000;

interface CalendarData {
  posts?: any[];
  content?: string;
  month: string;
  source?: string;
}

export default function CalendarPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchCalendar = useCallback(async (showSyncing = false) => {
    if (showSyncing) setSyncing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/calendar?month=${month}&t=${Date.now()}`);
      const json = await res.json();
      setData(json);
      setLastSync(new Date());
    } catch {
      // mantém dados anteriores
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [clientId, month]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  useEffect(() => {
    const interval = setInterval(() => fetchCalendar(true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchCalendar]);

  const sourceLabel = data?.source === "trello" ? "Trello" : data?.source === "obsidian" ? "Obsidian" : null;
  const hasPosts = (data?.posts?.length ?? 0) > 0 || (data?.content?.length ?? 0) > 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[#111]">Calendário de Conteúdo</h2>
          {sourceLabel && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#888]">
              via {sourceLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-[10px] text-[#bbb]">
              Atualizado às {lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-xs border border-[#e5e5e5] rounded-lg px-2 py-1.5 bg-white"
          />
          <button
            onClick={() => fetchCalendar(true)}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-[#e5e5e5] text-[#555] rounded-lg hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sincronizando…" : "Sincronizar"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#888] py-8">
          <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          Carregando calendário…
        </div>
      ) : hasPosts ? (
        <CalendarView
          posts={data?.posts}
          markdown={data?.content}
          month={month}
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center">
          <p className="text-sm text-[#888] mb-1">Nenhum conteúdo para {month}</p>
          <p className="text-xs text-[#bbb]">Adicione cards no Trello e clique em Sincronizar.</p>
        </div>
      )}
    </div>
  );
}
