"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GlobalCalendarView } from "@/components/calendar/GlobalCalendarView";

interface Client {
  id: string;
  name: string;
  niche: string;
  status: string;
  instagramHandle?: string;
  profilePictureUrl?: string;
}

interface ClientMetrics {
  clientId: string;
  clientName: string;
  followers: number;
  followerGrowth: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  niche: string;
}

const NICHE_LABELS: Record<string, string> = {
  "life-insurance": "Life Insurance",
  "real-estate": "Imóveis",
  "general": "Geral",
};

const AVATAR_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];
function avatarColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function GrowthBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-medium text-[#059669]">
      <TrendingUp size={10} /> +{value}
    </span>
  );
  if (value < 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-medium text-[#e11d48]">
      <TrendingDown size={10} /> {value}
    </span>
  );
  return <span className="flex items-center gap-0.5 text-[10px] text-[#888]"><Minus size={10} /> 0</span>;
}

async function fetchBenchmark(): Promise<ClientMetrics[]> {
  const [clientsRes, logsRes] = await Promise.all([
    fetch("/api/clients"),
    fetch("/api/pipeline/logs"),
  ]);
  const clients: Client[] = await clientsRes.json();
  const logs: any[] = await logsRes.json();

  const latestByClient: Record<string, any> = {};
  for (const log of logs) {
    if (log.job === "metrics" && log.status === "success" && !latestByClient[log.clientId]) {
      latestByClient[log.clientId] = log;
    }
  }

  return clients.map((c) => {
    const log = latestByClient[c.id];
    const details: { label: string; value: string | number }[] = log?.details ?? [];
    const get = (label: string) => {
      const d = details.find((d) => d.label === label);
      if (!d) return 0;
      return typeof d.value === "number" ? d.value : parseFloat(String(d.value).replace(/\./g, "").replace(",", ".")) || 0;
    };
    return {
      clientId: c.id,
      clientName: c.name,
      niche: c.niche,
      followers: get("Seguidores"),
      followerGrowth: get("Crescimento"),
      reach: get("Alcance (30d)"),
      impressions: get("Impressões (30d)"),
      engagementRate: parseFloat(String(details.find((d) => d.label === "Engajamento")?.value ?? "0").replace("%", "")) || 0,
    };
  });
}

const METRIC_COLS = [
  { key: "followers" as const, label: "Seguidores", color: "#8b5cf6" },
  { key: "reach" as const, label: "Alcance 30d", color: "#06b6d4" },
  { key: "impressions" as const, label: "Impressões 30d", color: "#f59e0b" },
  { key: "engagementRate" as const, label: "Engajamento", color: "#10b981" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-[#888] uppercase tracking-widest mb-4 flex items-center gap-2">
      <span className="flex-1 h-px bg-[#e5e5e5]" />
      {children}
      <span className="flex-1 h-px bg-[#e5e5e5]" />
    </h2>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<ClientMetrics[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().toISOString().slice(0, 7));
  const [nicheFilter, setNicheFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients);
    fetchBenchmark().then(setMetrics).finally(() => setLoadingMetrics(false));
  }, []);

  const niches = ["all", ...Array.from(new Set(metrics.map((m) => m.niche)))];
  const filteredMetrics = nicheFilter === "all" ? metrics : metrics.filter((m) => m.niche === nicheFilter);
  const maxValues = METRIC_COLS.reduce((acc, col) => {
    acc[col.key] = Math.max(...filteredMetrics.map((m) => m[col.key] as number), 1);
    return acc;
  }, {} as Record<string, number>);

  const hasRealData = metrics.some((m) => m.followers > 0);

  return (
    <div className="p-6 space-y-10">

      {/* ── BENCHMARK ── */}
      <section>
        <SectionTitle>Benchmark</SectionTitle>

        {/* Niche filter */}
        {niches.length > 2 && (
          <div className="flex gap-1.5 mb-4">
            {niches.map((n) => (
              <button
                key={n}
                onClick={() => setNicheFilter(n)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  nicheFilter === n
                    ? "bg-[#8b5cf6] text-white"
                    : "bg-[#f5f5f5] text-[#555] hover:bg-[#ebe8f5] hover:text-[#8b5cf6]"
                }`}
              >
                {n === "all" ? "Todos os nichos" : (NICHE_LABELS[n] ?? n)}
              </button>
            ))}
          </div>
        )}

        {loadingMetrics ? (
          <div className="flex items-center gap-2 text-sm text-[#888]">
            <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
            Carregando métricas…
          </div>
        ) : !hasRealData ? (
          <div className="bg-[#fef3c7] border border-[#fcd34d] text-[#92400e] text-xs px-4 py-3 rounded-lg">
            Rode a "Coleta de Métricas" no Pipeline para ver dados reais de cada cliente.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {METRIC_COLS.map((col) => {
                const vals = filteredMetrics.map((m) => m[col.key] as number);
                const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                const top = [...filteredMetrics].sort((a, b) => (b[col.key] as number) - (a[col.key] as number))[0];
                return (
                  <div key={col.key} className="bg-white rounded-xl border border-[#e5e5e5] p-4">
                    <div className="w-2 h-2 rounded-full mb-2" style={{ background: col.color }} />
                    <p className="text-[10px] text-[#888] mb-0.5">{col.label}</p>
                    <p className="text-sm font-bold text-[#111]">
                      {col.key === "engagementRate" ? `${avg.toFixed(2)}%` : Math.round(avg).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-[#aaa] mt-1">média · 🏆 {top?.clientName.split(" ")[0]}</p>
                  </div>
                );
              })}
            </div>

            {/* Comparison table */}
            <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f5f5f5]">
                    <th className="text-left text-xs font-medium text-[#888] px-4 py-3 w-44">Cliente</th>
                    {METRIC_COLS.map((col) => (
                      <th key={col.key} className="text-left text-xs font-medium text-[#888] px-4 py-3">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMetrics
                    .sort((a, b) => b.followers - a.followers)
                    .map((m) => (
                      <tr key={m.clientId} className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          <Link href={`/clients/${m.clientId}/metrics`} className="hover:text-[#8b5cf6]">
                            <p className="text-sm font-medium text-[#111]">{m.clientName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-[#888]">{NICHE_LABELS[m.niche] ?? m.niche}</span>
                              <GrowthBadge value={m.followerGrowth} />
                            </div>
                          </Link>
                        </td>
                        {METRIC_COLS.map((col) => (
                          <td key={col.key} className="px-4 py-3 min-w-[140px]">
                            {col.key === "engagementRate" ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min((m[col.key] as number) * 10, 100)}%`, background: col.color }} />
                                </div>
                                <span className="text-xs text-[#555] w-14 text-right">{(m[col.key] as number).toFixed(2)}%</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${maxValues[col.key] > 0 ? Math.round(((m[col.key] as number) / maxValues[col.key]) * 100) : 0}%`, background: col.color }} />
                                </div>
                                <span className="text-xs text-[#555] w-14 text-right">{(m[col.key] as number).toLocaleString("pt-BR")}</span>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ── CALENDÁRIO ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Calendário Global</SectionTitle>
          <input
            type="month"
            value={calMonth}
            onChange={(e) => setCalMonth(e.target.value)}
            className="text-xs border border-[#e5e5e5] rounded-lg px-2 py-1.5 bg-white ml-4"
          />
        </div>
        <GlobalCalendarView month={calMonth} />
      </section>

      {/* ── CLIENTES ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Clientes</SectionTitle>
          <Link
            href="/clients/new"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
          >
            <Plus size={12} /> Novo Cliente
          </Link>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}/metrics`}
              className="bg-white rounded-xl border border-[#e5e5e5] p-4 hover:border-[#8b5cf6] hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                {c.profilePictureUrl ? (
                  <img src={c.profilePictureUrl} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-[#e5e5e5]" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: avatarColor(c.id) }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111] truncate group-hover:text-[#8b5cf6] transition-colors">{c.name}</p>
                  <p className="text-xs text-[#888]">{NICHE_LABELS[c.niche] ?? c.niche}</p>
                  {c.instagramHandle && <p className="text-[10px] text-[#aaa]">@{c.instagramHandle}</p>}
                </div>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                c.status === "active" ? "bg-[#d1fae5] text-[#059669]" : "bg-[#f5f5f5] text-[#888]"
              }`}>
                {c.status === "active" ? "Ativo" : c.status}
              </span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
