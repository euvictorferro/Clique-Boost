"use client";

import { useEffect, useState, use } from "react";
import { TrendingUp, GitBranch, Map, ChevronDown, ChevronUp, ExternalLink, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Tab = "funnel" | "strategy" | "mindmap";

interface StrategyData {
  strategy: string;
  funnel: string;
  mindmap: string;
  hasStrategy: boolean;
  availableMonths: string[]; // ["2026-07", "2026-06", ...]
  month: string | null;
}

const MONTH_NAMES: Record<string, string> = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
  "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
  "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro",
};

function formatMonth(ym: string) {
  // "2026-06" → "Junho 2026"
  const [year, month] = ym.split("-");
  return `${MONTH_NAMES[month] ?? month} ${year}`;
}

/** Get current YYYY-MM */
function currentYM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function MarkdownSection({ content, title, icon: Icon }: {
  content: string;
  title: string;
  icon: React.ElementType;
}) {
  const [open, setOpen] = useState(true);
  if (!content) return null;

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#fafafa] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-[#8b5cf6]" />
          <span className="text-sm font-semibold text-[#111]">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-[#888]" /> : <ChevronDown size={14} className="text-[#888]" />}
      </button>
      {open && (
        <div className="px-5 pb-5 prose prose-sm max-w-none border-t border-[#f0f0f0]
          prose-headings:text-[#111] prose-headings:font-semibold
          prose-h1:text-base prose-h1:mt-4
          prose-h2:text-sm prose-h2:mt-4 prose-h2:mb-2
          prose-h3:text-xs prose-h3:mt-3 prose-h3:mb-1 prose-h3:text-[#555]
          prose-p:text-sm prose-p:text-[#333] prose-p:my-1.5
          prose-li:text-sm prose-li:text-[#333] prose-li:my-0.5
          prose-strong:text-[#111] prose-strong:font-semibold
          prose-blockquote:border-[#8b5cf6] prose-blockquote:text-[#555] prose-blockquote:not-italic
          prose-a:text-[#8b5cf6] prose-a:no-underline hover:prose-a:underline
          prose-table:text-xs prose-th:font-semibold prose-th:text-[#111]
          prose-td:text-[#333]
          prose-code:text-[#8b5cf6] prose-code:bg-[#f5f0ff] prose-code:px-1 prose-code:rounded
          [&_hr]:border-[#f0f0f0] [&_hr]:my-4
        ">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5">
                  {children}<ExternalLink size={10} />
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

const FUNNEL_STAGES = [
  { key: "TOPO", label: "Topo do Funil", color: "#8b5cf6", desc: "Atrair e gerar awareness" },
  { key: "MEIO", label: "Meio do Funil", color: "#3b82f6", desc: "Engajar e educar" },
  { key: "FUNDO", label: "Fundo do Funil", color: "#10b981", desc: "Converter e fechar" },
];

export default function StrategyPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const [data, setData] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("funnel");
  // selectedMonth: null = current (no suffix), string = specific month
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const url = selectedMonth
      ? `/api/clients/${clientId}/strategy?month=${selectedMonth}`
      : `/api/clients/${clientId}/strategy`;
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [clientId, selectedMonth]);

  // Build month list for selector: always include current month at top
  const cur = currentYM();
  const allMonths: string[] = data
    ? Array.from(new Set([cur, ...data.availableMonths])).sort().reverse()
    : [cur];

  const displayMonth = selectedMonth ?? cur;

  function prevMonth() {
    const idx = allMonths.indexOf(displayMonth);
    if (idx < allMonths.length - 1) setSelectedMonth(allMonths[idx + 1]);
  }
  function nextMonth() {
    const idx = allMonths.indexOf(displayMonth);
    if (idx > 0) setSelectedMonth(allMonths[idx - 1]);
  }

  const isCurrentMonth = !selectedMonth || selectedMonth === cur;

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-[#888]">
        <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
        Carregando estratégia…
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.ElementType; hasContent: boolean }[] = [
    { key: "funnel", label: "Funil Orgânico", icon: TrendingUp, hasContent: !!(data?.funnel) },
    { key: "strategy", label: "Estratégia", icon: GitBranch, hasContent: !!(data?.strategy) },
    { key: "mindmap", label: "Mapa Mental", icon: Map, hasContent: !!(data?.mindmap) },
  ];

  return (
    <div className="p-6">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-[#111]">Estratégia de Conteúdo</h2>

        {/* Month navigator */}
        <div className="flex items-center gap-1 bg-white border border-[#e5e5e5] rounded-lg px-1 py-1">
          <button
            onClick={prevMonth}
            disabled={allMonths.indexOf(displayMonth) >= allMonths.length - 1}
            className="p-1 rounded hover:bg-[#f5f5f5] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} className="text-[#555]" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            <Calendar size={12} className="text-[#8b5cf6]" />
            <span className="text-xs font-medium text-[#111] min-w-[100px] text-center">
              {formatMonth(displayMonth)}
            </span>
            {isCurrentMonth && (
              <span className="text-[9px] font-semibold bg-[#8b5cf6] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                atual
              </span>
            )}
          </div>

          <button
            onClick={nextMonth}
            disabled={allMonths.indexOf(displayMonth) <= 0}
            className="p-1 rounded hover:bg-[#f5f5f5] disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} className="text-[#555]" />
          </button>
        </div>
      </div>

      {/* Month history pills (if more than 1 month available) */}
      {allMonths.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {allMonths.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m === cur ? null : m)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                displayMonth === m
                  ? "bg-[#8b5cf6] text-white"
                  : "bg-[#f5f5f5] text-[#555] hover:bg-[#ebe8f5] hover:text-[#8b5cf6]"
              }`}
            >
              {formatMonth(m)}
            </button>
          ))}
        </div>
      )}

      {!data?.hasStrategy ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center">
          <TrendingUp size={32} className="text-[#ddd] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#333] mb-1">
            {selectedMonth
              ? `Nenhuma estratégia salva para ${formatMonth(selectedMonth)}`
              : "Estratégia não gerada ainda"}
          </p>
          <p className="text-xs text-[#888] max-w-xs mx-auto">
            {selectedMonth
              ? `Crie o arquivo estrategia-conteudo-${selectedMonth}.md no Obsidian para este mês aparecer.`
              : "Execute o pipeline completo para gerar a estratégia de conteúdo, funil orgânico e mapa mental para este cliente."}
          </p>
        </div>
      ) : (
        <>
          {/* Funil visual rápido */}
          {data.funnel && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {FUNNEL_STAGES.map((stage) => {
                const mentioned = data.funnel.toUpperCase().includes(stage.key);
                return (
                  <div
                    key={stage.key}
                    className="bg-white rounded-xl border border-[#e5e5e5] p-4 flex flex-col gap-1"
                    style={{ borderTopWidth: 3, borderTopColor: mentioned ? stage.color : "#e5e5e5" }}
                  >
                    <span className="text-xs font-bold" style={{ color: stage.color }}>{stage.label}</span>
                    <span className="text-[10px] text-[#888]">{stage.desc}</span>
                    {!mentioned && <span className="text-[10px] text-[#ccc] mt-1">Não definido</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-[#e5e5e5] pb-0">
            {TABS.filter((t) => t.hasContent).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === key
                    ? "border-[#8b5cf6] text-[#8b5cf6]"
                    : "border-transparent text-[#888] hover:text-[#333]"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {activeTab === "funnel" && data.funnel && (
            <MarkdownSection content={data.funnel} title="Funil Orgânico Detalhado" icon={TrendingUp} />
          )}
          {activeTab === "strategy" && data.strategy && (
            <MarkdownSection content={data.strategy} title="Estratégia de Conteúdo" icon={GitBranch} />
          )}
          {activeTab === "mindmap" && data.mindmap && (
            <MarkdownSection content={data.mindmap} title="Mapa Mental" icon={Map} />
          )}
        </>
      )}
    </div>
  );
}
