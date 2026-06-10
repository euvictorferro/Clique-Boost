"use client";

import { use, useEffect, useState } from "react";
import { Calendar, Clock, Users, ChevronDown, ChevronUp, FileText, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
  clientIds: string[];
  summary: string;
  syncedAt: string;
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const [open, setOpen] = useState(false);

  const date = new Date(meeting.date);
  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Rough reading time
  const words = meeting.summary.split(/\s+/).length;
  const readMin = Math.max(1, Math.round(words / 200));

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden hover:border-[#8b5cf6]/40 transition-colors">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        {/* Date badge */}
        <div className="shrink-0 w-11 rounded-lg bg-[#f5f0ff] border border-[#ddd6fe] flex flex-col items-center py-1.5 text-[#7c3aed]">
          <span className="text-[10px] font-bold uppercase leading-none">
            {date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
          </span>
          <span className="text-lg font-bold leading-tight">{date.getDate()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#111] leading-snug">{meeting.title}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#888]">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {dateStr}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {timeStr}
            </span>
            <span className="flex items-center gap-1">
              <FileText size={10} />
              ~{readMin} min leitura
            </span>
          </div>
          {meeting.participants.length > 0 && (
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#888]">
              <Users size={10} />
              {meeting.participants.join(", ")}
            </div>
          )}
        </div>

        <div className="shrink-0 text-[#aaa] mt-0.5">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Summary */}
      {open && (
        <div className="px-4 pb-4 border-t border-[#f0f0f0] pt-3">
          <div className="prose prose-sm max-w-none text-[#333] text-xs leading-relaxed
            [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-[#111] [&_h3]:mt-3 [&_h3]:mb-1
            [&_h4]:text-[12px] [&_h4]:font-medium [&_h4]:text-[#333] [&_h4]:mt-2 [&_h4]:mb-0.5
            [&_ul]:pl-4 [&_li]:mb-0.5
            [&_p]:mb-2">
            <ReactMarkdown>{meeting.summary}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MeetingsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/clients/${clientId}/meetings`)
      .then((r) => r.json())
      .then((d) => setMeetings(d.meetings ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [clientId]);

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-[#111]">Reuniões</h2>
          <p className="text-xs text-[#888] mt-0.5">
            Atas sincronizadas do Granola · {meetings.length} reunião{meetings.length !== 1 ? "ões" : ""} registrada{meetings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
          title="Recarregar"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#888]">
          <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          Carregando reuniões…
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 text-[#aaa]">
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-[#666]">Nenhuma reunião registrada</p>
          <p className="text-xs mt-1">
            Peça ao Claude para sincronizar as reuniões do Granola.
          </p>
          <div className="mt-4 inline-block bg-[#f5f5f5] rounded-lg px-4 py-2 text-[11px] text-[#666] font-mono text-left">
            "Claude, sincroniza as reuniões do Granola"
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      )}

      {/* Sync hint */}
      {meetings.length > 0 && (
        <div className="mt-6 p-3 bg-[#f5f5f5] rounded-lg text-[11px] text-[#888]">
          💡 Para sincronizar novas reuniões, peça ao Claude:{" "}
          <span className="font-mono text-[#555]">"Sincroniza as reuniões do Granola"</span>
        </div>
      )}
    </div>
  );
}
