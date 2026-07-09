"use client";

import { useEffect, useState, useCallback, use } from "react";
import { CalendarView, Post } from "@/components/client/CalendarView";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { Board } from "@clique-boost/shared";
import { RefreshCw, Sparkles, ChevronDown, Trello, Calendar } from "lucide-react";

const AUTO_REFRESH_MS = 5 * 60 * 1000;

interface CalendarData {
  posts?: Post[];
  content?: string;
  month: string;
  source?: string;
}

interface GenerateResult {
  posts: Post[];
  generated: boolean;
}

export default function CalendarPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Generator state
  const [genWeek, setGenWeek] = useState(1);
  const [genLoading, setGenLoading] = useState(false);
  const [genPosts, setGenPosts] = useState<Post[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Kanban
  const [view, setView] = useState<"kanban" | "calendar">("kanban");
  const [board, setBoard] = useState<Board | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);

  const fetchCalendar = useCallback(async (showSyncing = false) => {
    if (showSyncing) setSyncing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/calendar?month=${month}&t=${Date.now()}`);
      const json = await res.json();
      setData(json);
      setLastSync(new Date());
    } catch { /* mantém dados anteriores */ }
    finally { setLoading(false); setSyncing(false); }
  }, [clientId, month]);

  // Carrega posts gerados existentes para a semana selecionada
  const fetchGenPosts = useCallback(async (week: number) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/generate-posts?month=${month}&week=${week}`);
      const json: GenerateResult = await res.json();
      if (json.generated) setGenPosts(json.posts);
      else setGenPosts([]);
    } catch { setGenPosts([]); }
  }, [clientId, month]);

  const fetchBoard = useCallback(async () => {
    setBoardLoading(true);
    try {
      const res = await fetch(`/api/boards/${clientId}`);
      if (res.ok) setBoard(await res.json());
    } finally {
      setBoardLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);
  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  useEffect(() => {
    const interval = setInterval(() => fetchCalendar(true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchCalendar]);

  useEffect(() => {
    if (showGenerator) fetchGenPosts(genWeek);
  }, [showGenerator, genWeek, fetchGenPosts]);

  const handleGenerate = async () => {
    setGenLoading(true);
    setGenError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/generate-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, week: genWeek }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao gerar");
      setGenPosts(json.posts ?? []);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Erro ao gerar posts");
    } finally {
      setGenLoading(false);
    }
  };

  const sourceLabel = data?.source === "trello" ? "Trello" : data?.source === "obsidian" ? "Obsidian" : null;
  const trelloPosts = data?.posts ?? [];
  const hasTrelloPosts = trelloPosts.length > 0 || (data?.content?.length ?? 0) > 0;

  // Meses para o current month (week labels)
  const [year, monthNum] = month.split("-").map(Number);
  const weekLabels = [1, 2, 3, 4].map((w) => {
    const start = (w - 1) * 7 + 1;
    const end = Math.min(w * 7, new Date(year, monthNum, 0).getDate());
    return { week: w, label: `Semana ${w} (dias ${start}–${end})` };
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[#111]">Calendário de Conteúdo</h2>
          {view === "calendar" && sourceLabel && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#888]">
              via {sourceLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Kanban / Calendário */}
          <div className="flex items-center bg-[#f5f5f5] rounded-lg p-0.5">
            <button
              onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                view === "kanban" ? "bg-white shadow-sm text-[#8b5cf6] font-medium" : "text-[#888] hover:text-[#555]"
              }`}
            >
              <Trello size={12} />
              Kanban
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                view === "calendar" ? "bg-white shadow-sm text-[#8b5cf6] font-medium" : "text-[#888] hover:text-[#555]"
              }`}
            >
              <Calendar size={12} />
              Calendário
            </button>
          </div>

          {view === "calendar" && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* ✨ Generator Panel */}
      <div className="mb-5 bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafafa] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#8b5cf6]" />
            <span className="text-sm font-medium text-[#111]">Gerar posts com IA</span>
            <span className="text-[10px] text-[#888] bg-[#f5f0ff] text-[#8b5cf6] px-2 py-0.5 rounded-full">
              ICP + Estratégia + Concorrentes
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-[#888] transition-transform ${showGenerator ? "rotate-180" : ""}`}
          />
        </button>

        {showGenerator && (
          <div className="border-t border-[#f0f0f0] px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <label className="text-xs text-[#888] block mb-1">Semana</label>
                <select
                  value={genWeek}
                  onChange={(e) => setGenWeek(Number(e.target.value))}
                  className="text-xs border border-[#e5e5e5] rounded-lg px-2 py-1.5 bg-white"
                >
                  {weekLabels.map(({ week, label }) => (
                    <option key={week} value={week}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={genLoading}
                  className="flex items-center gap-2 text-xs px-4 py-2 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
                >
                  <Sparkles size={12} className={genLoading ? "animate-pulse" : ""} />
                  {genLoading ? "Gerando com IA…" : "Gerar 5 posts"}
                </button>
              </div>
            </div>

            {genError && (
              <p className="text-xs text-red-500 mb-3">{genError}</p>
            )}

            {genPosts.length > 0 && (
              <div>
                <p className="text-xs text-[#888] mb-3">
                  {genPosts.length} posts gerados para a Semana {genWeek} · Clique no status para avançar o fluxo
                </p>
                <CalendarView
                  posts={genPosts}
                  month={month}
                  clientId={clientId}
                />
              </div>
            )}

            {!genLoading && genPosts.length === 0 && (
              <p className="text-xs text-[#aaa]">
                Clique em "Gerar 5 posts" para criar sugestões baseadas no ICP, estratégia e análise de concorrentes do cliente.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Kanban nativo */}
      {view === "kanban" && (
        boardLoading ? (
          <div className="flex items-center gap-2 text-sm text-[#888] py-8">
            <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
            Carregando board…
          </div>
        ) : board ? (
          <KanbanBoard initialBoard={board} clientId={clientId} />
        ) : (
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center">
            <p className="text-sm text-[#888]">Board não encontrado para este cliente.</p>
          </div>
        )
      )}

      {/* Calendário mensal */}
      {view === "calendar" && (loading ? (
        <div className="flex items-center gap-2 text-sm text-[#888] py-8">
          <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          Carregando calendário…
        </div>
      ) : hasTrelloPosts ? (
        <>
          <p className="text-xs text-[#aaa] mb-3 font-medium uppercase tracking-wide">Calendário</p>
          <CalendarView
            posts={data?.posts}
            markdown={data?.content}
            month={month}
            clientId={clientId}
          />
        </>
      ) : (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center">
          <p className="text-sm text-[#888] mb-1">Nenhum conteúdo para {month}</p>
          <p className="text-xs text-[#bbb]">Use o gerador acima para criar posts e sincronizar com o Kanban.</p>
        </div>
      ))}
    </div>
  );
}
