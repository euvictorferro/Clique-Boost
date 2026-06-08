"use client";

import { useEffect, useState } from "react";
import { CalendarView } from "@/components/client/CalendarView";
import { RefreshCw } from "lucide-react";

export default function CalendarPage({ params }: { params: { clientId: string } }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<{ content: string; month: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients/${params.clientId}/calendar?month=${month}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.clientId, month]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-[#111]">Calendário de Conteúdo</h2>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-xs border border-[#e5e5e5] rounded-lg px-2 py-1.5 bg-white"
          />
          <button
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
            onClick={() => {
              fetch(`/api/pipeline/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: params.clientId, job: "calendar" }) });
            }}
          >
            <RefreshCw size={12} />
            Regenerar Calendário
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#888]">Carregando calendário…</p>
      ) : data ? (
        <CalendarView markdown={data.content} month={month} />
      ) : null}
    </div>
  );
}
